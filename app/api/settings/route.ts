import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/middleware';
import { UpdateSettingSchema } from '@/lib/validators/settings';

export const GET = withRole('ADMIN', async (req) => {
  const settings = await prisma.siteSetting.findMany({ orderBy: { key: 'asc' } });
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return NextResponse.json({ data: map });
});

export const PATCH = withRole('ADMIN', async (req) => {
  const body = await req.json();
  if (!body.key || !body.value) {
    return NextResponse.json({ error: 'key and value are required', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const parsed = UpdateSettingSchema.safeParse({ value: body.value });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 });
  }

  const setting = await prisma.siteSetting.upsert({
    where: { key: String(body.key) },
    update: { value: parsed.data.value },
    create: { key: String(body.key), value: parsed.data.value },
  });

  return NextResponse.json({ data: setting });
});
