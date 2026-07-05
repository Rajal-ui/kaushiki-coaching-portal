import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { loginSchema } from '@/lib/validators/auth';
import { prisma } from '@/lib/db/prisma';
import { signAccessToken, signRefreshToken, generateSessionId, hashRefreshToken } from '@/lib/auth/jwt';
import { buildRefreshTokenRedisKey } from '@/lib/auth/otp';
import { redis } from '@/lib/redis';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { identifier, password } = parsed.data;

  try {
    const isPhone = /^[6-9]\d{9}$/.test(identifier);
    const user = isPhone
      ? await prisma.user.findUnique({ where: { phone: identifier } })
      : await prisma.user.findUnique({ where: { email: identifier } });

    if (!user) {
      return NextResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password' } },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password' } },
        { status: 401 }
      );
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended. Contact support.' } },
        { status: 403 }
      );
    }

    if (user.status === 'PENDING_VERIFICATION') {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'ACTIVE' },
      });
    }

    const sessionId = generateSessionId();
    const accessToken = await signAccessToken(user.id, user.role, sessionId);
    const refreshToken = await signRefreshToken(user.id, sessionId);

    const refreshKey = buildRefreshTokenRedisKey(sessionId);
    const refreshHash = hashRefreshToken(refreshToken);
    try {
      await redis.set(refreshKey, refreshHash, 'EX', 7 * 24 * 60 * 60);
    } catch {
      console.warn('[Login] Redis unavailable — refresh token not cached');
    }

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('[Login] Error:', err);
    return NextResponse.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable. Please try again.' } },
      { status: 503 }
    );
  }
}
