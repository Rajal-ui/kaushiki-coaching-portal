import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

// ---------------------------------------------------------------------------
// Secret storage helpers — AES-256-GCM encryption at rest.
// Used by the admin settings service so API credentials are never stored as
// plaintext in the database.
// ---------------------------------------------------------------------------

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const VERSION_PREFIX = 'v1';

function getKeyMaterial(): string {
  const material = process.env.SETTINGS_ENCRYPTION_KEY || process.env.JWT_ACCESS_SECRET;
  if (!material) {
    throw new Error(
      '[Settings] SETTINGS_ENCRYPTION_KEY (or JWT_ACCESS_SECRET) is required to encrypt settings'
    );
  }
  return material;
}

/** Derive a stable 32-byte key from the configured material. */
function deriveKey(): Buffer {
  return createHash('sha256').update(getKeyMaterial()).digest();
}

export function encryptSecret(value: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSION_PREFIX,
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

export function decryptSecret(stored: string): string {
  if (!stored.startsWith(`${VERSION_PREFIX}:`)) {
    throw new Error('[Settings] Unsupported encrypted value format');
  }
  const [, ivB64, tagB64, dataB64] = stored.split(':');
  const decipher = createDecipheriv(ALGORITHM, deriveKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

/**
 * Return a masked preview of a secret (e.g. "••••••••••abcd") so the admin UI
 * can show "configured" without ever exposing the plaintext value.
 */
export function maskSecret(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) return '••••';
  const tail = trimmed.slice(-4);
  return `${'•'.repeat(8)}${tail}`;
}

/** Detect whether a stored string looks like an encrypted secret. */
export function isEncryptedSecret(value: string): boolean {
  return value.startsWith(`${VERSION_PREFIX}:`);
}
