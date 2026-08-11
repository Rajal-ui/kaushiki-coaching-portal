import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { getSystemSettings, UpdateSettingsSchema, updateSystemSettings } from '@/lib/settings';
import { isSecretSettingKey } from '@/lib/settings';

export const GET = withRole('ADMIN', async () => {
  try {
    const data = await getSystemSettings();
    return NextResponse.json({ data });
  } catch (err) {
    console.error('[Admin Settings] GET error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to load settings' } },
      { status: 500 }
    );
  }
});

export const PATCH = withRole('ADMIN', async (req) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object' || !('values' in body) || typeof body.values !== 'object' || body.values === null) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'values object is required' } },
      { status: 400 }
    );
  }

  const values = body.values as Record<string, string>;

  const parsed = UpdateSettingsSchema.safeParse(values);
  if (!parsed.success) {
    const details = Object.fromEntries(
      parsed.error.issues.map((issue) => [issue.path.join('.'), issue.message])
    );
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details } },
      { status: 400 }
    );
  }

  const changedKeys = Object.keys(parsed.data).filter((key) => values[key]?.trim() !== '');

  try {
    const data = await updateSystemSettings(parsed.data as Record<string, string>);

    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    if (userId && changedKeys.length > 0) {
      await prisma.auditLog
        .create({
          data: {
            action: 'SETTINGS_UPDATED',
            entityType: 'system_settings',
            userId,
            details: {
              updatedKeys: changedKeys,
              secretsUpdated: changedKeys.filter((k) => isSecretSettingKey(k)),
              // Never log secret values.
            },
            ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
            userAgent: req.headers.get('user-agent') ?? undefined,
          },
        })
        .catch((err) => console.error('[Admin Settings] Audit log failed:', err));
    }

    return NextResponse.json({ data });
  } catch (err) {
    const e = err as Error & { code?: string; details?: unknown };
    if (e.code === 'VALIDATION_ERROR') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: e.message, details: e.details } },
        { status: 400 }
      );
    }
    console.error('[Admin Settings] PATCH error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to save settings' } },
      { status: 500 }
    );
  }
});
