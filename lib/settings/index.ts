import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import type {
  SettingCategory,
  SystemSettingsResponse,
  SystemSettingsSection,
  SystemSettingValue,
} from '@/types/settings';
import {
  getSettingDefinition,
  getSettingsForCategory,
  SECRET_SETTING_KEYS,
  SETTING_SECTIONS,
  SYSTEM_SETTING_KEYS,
} from '@/lib/settings/registry';
import { decryptSecret, encryptSecret, maskSecret } from '@/lib/settings/crypto';

// ---------------------------------------------------------------------------
// Zod validation builders — one schema per setting type.
// Empty strings are allowed so fields can be cleared (or left "unchanged" for
// secrets).
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function schemaForType(type: SystemSettingValue['type'], options?: string[]) {
  switch (type) {
    case 'select':
      return z
        .string()
        .trim()
        .max(50)
        .refine((v) => v === '' || options?.includes(v), {
          message: 'Invalid option',
        });
    case 'email':
      return z
        .string()
        .trim()
        .max(254)
        .refine((v) => v === '' || EMAIL_REGEX.test(v), 'Enter a valid email address');
    case 'url':
      return z
        .string()
        .trim()
        .max(2048)
        .refine(
          (v) => v === '' || /^https?:\/\//i.test(v),
          'Enter a valid URL (must start with http:// or https://)'
        );
    case 'number':
      return z
        .string()
        .trim()
        .max(10)
        .refine((v) => v === '' || !Number.isNaN(Number(v)), 'Must be a number');
    case 'password':
      return z.string().max(1024, 'Value is too long');
    case 'textarea':
      return z.string().max(2000, 'Value is too long');
    default:
      return z.string().max(500, 'Value is too long');
  }
}

function buildValidationSchema() {
  const shape: Record<string, z.ZodType> = {};
  for (const key of SYSTEM_SETTING_KEYS) {
    const def = getSettingDefinition(key);
    if (!def) continue;
    // Fields are optional so clients can submit a subset (e.g. one section).
    shape[key] = schemaForType(def.type, def.options).optional();
  }
  return z.object(shape).strict();
}

export const UpdateSettingsSchema = buildValidationSchema();

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

interface RawSetting {
  key: string;
  value: string;
  updatedAt: Date;
}

async function loadRows(): Promise<{
  publicRows: Map<string, RawSetting>;
  secretRows: Map<string, RawSetting>;
}> {
  const [siteSettings, systemConfigs] = await Promise.all([
    prisma.siteSetting.findMany(),
    prisma.systemConfig.findMany(),
  ]);

  const publicRows = new Map<string, RawSetting>();
  for (const s of siteSettings) publicRows.set(s.key, s);
  const secretRows = new Map<string, RawSetting>();
  for (const s of systemConfigs) secretRows.set(s.key, s);

  return { publicRows, secretRows };
}

function toFieldValue(
  def: ReturnType<typeof getSettingDefinition>,
  row: RawSetting | undefined
): SystemSettingValue {
  const isSecret = def?.storage === 'secret';
  const stored = row?.value ?? '';

  let displayValue = stored;
  let isConfigured = stored !== '';

  if (isSecret && stored) {
    try {
      displayValue = maskSecret(decryptSecret(stored));
    } catch {
      // Key material changed — do not crash the page, just hide the value.
      displayValue = '••••••••••';
    }
    displayValue = '';
  } else if (!isSecret && stored === '') {
    // Show the effective environment value so admins see what's live.
    displayValue = process.env[def!.key] ?? '';
  }

  return {
    key: def!.key,
    label: def!.label,
    description: def!.description,
    type: def!.type,
    options: def!.options,
    placeholder: def!.placeholder,
    value: displayValue,
    isSecret,
    isConfigured,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
  };
}

async function buildResponse(
  publicRows: Map<string, RawSetting>,
  secretRows: Map<string, RawSetting>
): Promise<SystemSettingsResponse> {
  const sections: SystemSettingsSection[] = [];
  const updatedAt: Partial<Record<SettingCategory, string>> = {};

  for (const category of Object.keys(SETTING_SECTIONS) as SettingCategory[]) {
    const defs = getSettingsForCategory(category);
    const fields: SystemSettingValue[] = [];
    let latest: Date | null = null;

    for (const def of defs) {
      const row = def.storage === 'secret' ? secretRows.get(def.key) : publicRows.get(def.key);
      fields.push(toFieldValue(def, row));
      if (row && (!latest || row.updatedAt > latest)) latest = row.updatedAt;
    }

    sections.push({
      id: category,
      title: SETTING_SECTIONS[category].title,
      description: SETTING_SECTIONS[category].description,
      fields,
    });
    if (latest) updatedAt[category] = latest.toISOString();
  }

  return { sections, updatedAt };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetch every registered setting, grouped by section, secrets masked. */
export async function getSystemSettings(): Promise<SystemSettingsResponse> {
  const { publicRows, secretRows } = await loadRows();
  return buildResponse(publicRows, secretRows);
}

/**
 * Persist a batch of settings. Only keys in the registry are accepted.
 * - Secret fields: a non-empty value is encrypted and stored; an empty value
 *   leaves the stored secret untouched.
 * - Public fields: an empty value clears the stored value.
 */
export async function updateSystemSettings(values: Record<string, string>): Promise<SystemSettingsResponse> {
  const { publicRows, secretRows } = await loadRows();

  const entries = Object.entries(values).filter(([key]) => SYSTEM_SETTING_KEYS.has(key));
  const errors: Record<string, string> = {};

  for (const [key, rawValue] of entries) {
    const def = getSettingDefinition(key)!;
    const parsed = schemaForType(def.type, def.options).safeParse(rawValue);
    if (!parsed.success) {
      errors[key] = parsed.error.issues[0]?.message ?? 'Invalid value';
    }
  }

  if (Object.keys(errors).length > 0) {
    const err = new Error('Validation failed') as Error & { code?: string; details?: unknown };
    err.code = 'VALIDATION_ERROR';
    err.details = errors;
    throw err;
  }

  for (const [key, rawValue] of entries) {
    const def = getSettingDefinition(key)!;
    const value = rawValue.trim();

    if (def.storage === 'secret') {
      if (value === '') continue; // keep existing secret
      const encrypted = encryptSecret(value);
      await prisma.systemConfig.upsert({
        where: { key },
        update: { value: encrypted },
        create: { key, value: encrypted },
      });
      secretRows.set(key, { key, value: encrypted, updatedAt: new Date() });
      continue;
    }

    if (value === '') {
      await prisma.siteSetting.deleteMany({ where: { key } });
      publicRows.delete(key);
      continue;
    }

    await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    publicRows.set(key, { key, value, updatedAt: new Date() });
  }

  return buildResponse(publicRows, secretRows);
}

/**
 * Resolve a setting at runtime: DB-backed value first, falling back to the
 * process environment. Allows credentials configured in the admin panel to
 * override (or fill in for) environment variables.
 */
export async function getEffectiveSetting(key: string): Promise<string | undefined> {
  const def = getSettingDefinition(key);
  if (!def) return process.env[key];

  if (def.storage === 'secret') {
    const row = await prisma.systemConfig.findUnique({ where: { key } });
    if (row?.value) {
      try {
        return decryptSecret(row.value);
      } catch {
        // fall through to env on decryption failure
      }
    }
    return process.env[key];
  }

  const row = await prisma.siteSetting.findUnique({ where: { key } });
  if (row?.value !== undefined && row.value !== '') return row.value;
  return process.env[key];
}

/** True when the key is registered as a sensitive credential. */
export function isSecretSettingKey(key: string): boolean {
  return SECRET_SETTING_KEYS.has(key);
}
