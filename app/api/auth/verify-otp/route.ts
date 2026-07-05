import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpSchema } from '@/lib/validators/auth';
import { verifyOtpHash, buildOtpRedisKey, MAX_ATTEMPTS } from '@/lib/auth/otp';
import { signAccessToken, signRefreshToken, generateSessionId, hashRefreshToken } from '@/lib/auth/jwt';
import { buildRefreshTokenRedisKey } from '@/lib/auth/otp';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/db/prisma';

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

  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { phone, otp } = parsed.data;

  const otpKey = buildOtpRedisKey(phone);
  const stored = await redis.get(otpKey);
  if (!stored) {
    return NextResponse.json(
      { error: { code: 'OTP_EXPIRED', message: 'OTP expired or not requested. Please request a new one.' } },
      { status: 400 }
    );
  }

  const { hash: hashedOtp, attempts } = JSON.parse(stored) as { hash: string; attempts: number };

  if (attempts >= MAX_ATTEMPTS) {
    await redis.del(otpKey);
    return NextResponse.json(
      { error: { code: 'OTP_EXHAUSTED', message: 'Maximum attempts exceeded. Please request a new OTP.' } },
      { status: 400 }
    );
  }

  const isValid = await verifyOtpHash(otp, hashedOtp);

  if (!isValid) {
    await redis.set(otpKey, JSON.stringify({ hash: hashedOtp, attempts: attempts + 1 }), 'KEEPTTL');
    const remaining = MAX_ATTEMPTS - attempts - 1;
    return NextResponse.json(
      { error: { code: 'INVALID_OTP', message: `Invalid OTP. ${remaining} attempt(s) remaining.` } },
      { status: 400 }
    );
  }

  await redis.del(otpKey);

  let user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    return NextResponse.json(
      { error: { code: 'USER_NOT_FOUND', message: 'No account found with this phone number. Please sign up first.' } },
      { status: 404 }
    );
  }

  if (user.status === 'SUSPENDED') {
    return NextResponse.json(
      { error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended. Contact support.' } },
      { status: 403 }
    );
  }

  if (user.status === 'PENDING_VERIFICATION') {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { status: 'ACTIVE', phoneVerified: true },
    });
  } else if (!user.phoneVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: true },
    });
  }

  const sessionId = generateSessionId();
  const accessToken = await signAccessToken(user.id, user.role, sessionId);
  const refreshToken = await signRefreshToken(user.id, sessionId);

  const refreshKey = buildRefreshTokenRedisKey(sessionId);
  const refreshHash = hashRefreshToken(refreshToken);
  await redis.set(refreshKey, refreshHash, 'EX', 7 * 24 * 60 * 60);

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
}
