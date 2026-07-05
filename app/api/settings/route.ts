import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { UpdateSettingSchema } from '@/lib/validators/settings';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin only' } }, { status: 403 });
  }

  const settings = await prisma.siteSetting.findMany({ orderBy: { key: 'asc' } });
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return NextResponse.json({ data: map });
}

export async function PATCH(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin only' } }, { status: 403 });
  }

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
}
