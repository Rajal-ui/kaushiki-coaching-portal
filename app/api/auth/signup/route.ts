import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signupSchema } from '@/lib/validators/auth';
import { verifyOtpHash, buildOtpRedisKey, detectChannel, MAX_ATTEMPTS } from '@/lib/auth/otp';
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/redis';
import { signAccessToken, signRefreshToken, generateSessionId, hashRefreshToken } from '@/lib/auth/jwt';
import { buildRefreshTokenRedisKey } from '@/lib/auth/otp';

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

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { name, phone, email, otp, role } = parsed.data;
  const identifier = phone ?? email!;
  const channel = detectChannel(identifier);

  try {
    if (channel === 'email') {
      const existingEmail = await prisma.user.findUnique({ where: { email: identifier } });
      if (existingEmail) {
        return NextResponse.json(
          { error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists. Please log in.' } },
          { status: 409 }
        );
      }
    } else {
      const existingPhone = await prisma.user.findUnique({ where: { phone: identifier } });
      if (existingPhone) {
        return NextResponse.json(
          { error: { code: 'PHONE_EXISTS', message: 'An account with this phone number already exists. Please log in.' } },
          { status: 409 }
        );
      }
    }

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

    const passwordSource = channel === 'email' ? identifier.slice(-6) : identifier.slice(-6);
    const passwordHash = await bcrypt.hash(passwordSource, 10);

    const userData: {
      name: string;
      passwordHash: string;
      role: string;
      status: string;
      phoneVerified?: boolean;
      emailVerified?: boolean;
      phone?: string;
      email?: string;
    } = {
      name,
      passwordHash,
      role: role || 'STUDENT',
      status: 'ACTIVE',
    };

    if (channel === 'email') {
      userData.email = identifier;
      userData.emailVerified = true;
    } else {
      userData.phone = identifier;
      userData.phoneVerified = true;
    }

    const user = await prisma.user.create({ data: userData as never });

    const sessionId = generateSessionId();
    const accessToken = await signAccessToken(user.id, user.role, sessionId, user.name);
    const refreshToken = await signRefreshToken(user.id, sessionId);

    const refreshKey = buildRefreshTokenRedisKey(sessionId);
    const refreshHash = hashRefreshToken(refreshToken);
    try {
      await redis.set(refreshKey, refreshHash, 'EX', 7 * 24 * 60 * 60);
    } catch {
      console.warn('[Signup] Redis unavailable — refresh token not cached');
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
    }, { status: 201 });
  } catch (err) {
    console.error('[Signup] Error:', err);
    return NextResponse.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable. Please try again.' } },
      { status: 503 }
    );
  }
}
