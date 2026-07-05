import { NextRequest, NextResponse } from 'next/server';
import { sendOtpSchema } from '@/lib/validators/auth';
import { generateOtp, hashOtp, buildOtpRedisKey, buildRateLimitRedisKey, OTP_TTL_SECONDS, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SECONDS } from '@/lib/auth/otp';
import { redis } from '@/lib/redis';
import { enqueueMockSms } from '@/lib/sms/mock';

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

  const parsed = sendOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { phone } = parsed.data;

  try {
    const rateLimitKey = buildRateLimitRedisKey(phone);
    const currentCount = await redis.incr(rateLimitKey);
    if (currentCount === 1) {
      await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS);
    }
    if (currentCount > RATE_LIMIT_MAX) {
      const ttl = await redis.ttl(rateLimitKey);
      return NextResponse.json(
        { error: { code: 'RATE_LIMIT_EXCEEDED', message: `Too many OTP requests. Try again in ${Math.ceil(ttl / 60)} minutes.` } },
        { status: 429 }
      );
    }

    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);
    const otpKey = buildOtpRedisKey(phone);

    await redis.set(otpKey, JSON.stringify({ hash: hashedOtp, attempts: 0 }), 'EX', OTP_TTL_SECONDS);

    await enqueueMockSms(phone, `Your Kaushiki Classes OTP is: ${otp}. It expires in 5 minutes.`);

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('[Send OTP] Error:', err);
    return NextResponse.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable. Please try again.' } },
      { status: 503 }
    );
  }
}
