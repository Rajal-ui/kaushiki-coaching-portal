import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpSchema } from '@/lib/validators/auth';
import { verifyOtpHash, buildOtpRedisKey, detectChannel, MAX_ATTEMPTS } from '@/lib/auth/otp';
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

  const { phone, email, otp } = parsed.data;
  const identifier = phone ?? email!;
  const channel = detectChannel(identifier);

  try {
    const otpKey = buildOtpRedisKey(identifier, channel);
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

    let user;
    if (channel === 'email') {
      user = await prisma.user.findUnique({ where: { email: identifier } });
    } else {
      user = await prisma.user.findUnique({ where: { phone: identifier } });
    }

    if (!user) {
      const notFoundMsg = channel === 'email'
        ? 'No account found with this email address. Please sign up first.'
        : 'No account found with this phone number. Please sign up first.';
      return NextResponse.json(
        { error: { code: 'USER_NOT_FOUND', message: notFoundMsg } },
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
      const updateData: { status: 'ACTIVE'; phoneVerified?: boolean; emailVerified?: boolean } = { status: 'ACTIVE' };
      if (channel === 'email') {
        updateData.emailVerified = true;
      } else {
        updateData.phoneVerified = true;
      }
      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    } else {
      const updateData: { phoneVerified?: boolean; emailVerified?: boolean } = {};
      if (channel === 'email' && !user.emailVerified) {
        updateData.emailVerified = true;
      } else if (channel === 'sms' && !user.phoneVerified) {
        updateData.phoneVerified = true;
      }
      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    }

    const sessionId = generateSessionId();
    const accessToken = await signAccessToken(user.id, user.role, sessionId, user.name);
    const refreshToken = await signRefreshToken(user.id, sessionId);

    const refreshKey = buildRefreshTokenRedisKey(sessionId);
    const refreshHash = hashRefreshToken(refreshToken);
    try {
      await redis.set(refreshKey, refreshHash, 'EX', 7 * 24 * 60 * 60);
    } catch {
      console.warn('[Verify OTP] Redis unavailable — refresh token not cached');
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
    console.error('[Verify OTP] Error:', err);
    return NextResponse.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable. Please try again.' } },
      { status: 503 }
    );
  }
}
