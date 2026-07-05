import { redis } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

export function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || '127.0.0.1';
}

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    const ttl = await redis.ttl(key);
    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      retryAfter: ttl,
    };
  } catch {
    return { allowed: true, remaining: 999, retryAfter: 0 };
  }
}

export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: { code: 'RATE_LIMIT_EXCEEDED', message: `Too many requests. Try again in ${Math.ceil(retryAfter / 60)} minutes.` } },
    { status: 429 }
  );
}
