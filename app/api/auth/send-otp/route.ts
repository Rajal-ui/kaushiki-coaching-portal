import { NextRequest, NextResponse } from 'next/server';
import { sendOtpSchema } from '@/lib/validators/auth';
import { generateOtp, hashOtp, buildOtpRedisKey, buildRateLimitRedisKey, detectChannel, OTP_TTL_SECONDS, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SECONDS } from '@/lib/auth/otp';
import { redis } from '@/lib/redis';
import { enqueueMockSms } from '@/lib/sms/mock';
import { sendEmailWithFallback, isEmailConfigured } from '@/lib/email';
import { otpEmailHtml, otpEmailText } from '@/lib/email/otp-template';

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

  const { phone, email } = parsed.data;
  const identifier = phone ?? email!;
  const channel = detectChannel(identifier);

  try {
    const rateLimitKey = buildRateLimitRedisKey(identifier, channel);
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
    const otpKey = buildOtpRedisKey(identifier, channel);

    await redis.set(otpKey, JSON.stringify({ hash: hashedOtp, attempts: 0, channel }), 'EX', OTP_TTL_SECONDS);

    if (channel === 'email') {
      if (!isEmailConfigured()) {
        console.warn(`[Send OTP] Email not configured — logging OTP for ${identifier}: ${otp}`);
      } else {
        const result = await sendEmailWithFallback({
          to: identifier,
          subject: 'Your Kaushiki Classes Verification Code',
          html: otpEmailHtml(otp, 'login'),
          text: otpEmailText(otp, 'login'),
        });
        if (!result.success) {
          console.error('[Send OTP] Email delivery failed:', result.error?.message);
        }
      }
    } else {
      await enqueueMockSms(identifier, `Your Kaushiki Classes OTP is: ${otp}. It expires in 5 minutes.`);
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('[Send OTP] Error:', err);
    return NextResponse.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable. Please try again.' } },
      { status: 503 }
    );
  }
}
