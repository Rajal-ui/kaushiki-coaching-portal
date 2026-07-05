import { NextRequest, NextResponse } from 'next/server';
import { refreshSchema } from '@/lib/validators/auth';
import { verifyRefreshToken, signAccessToken, signRefreshToken, generateSessionId, hashRefreshToken } from '@/lib/auth/jwt';
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

  const parsed = refreshSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { refreshToken } = parsed.data;

  try {
    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token expired or invalid' } },
        { status: 401 }
      );
    }

    const { sub: userId, sessionId: oldSessionId } = payload;

    const refreshKey = buildRefreshTokenRedisKey(oldSessionId);
    const storedHash = await redis.get(refreshKey);
    if (!storedHash) {
      return NextResponse.json(
        { error: { code: 'REFRESH_TOKEN_REVOKED', message: 'Refresh token has been revoked' } },
        { status: 401 }
      );
    }

    const expectedHash = hashRefreshToken(refreshToken);
    if (storedHash !== expectedHash) {
      return NextResponse.json(
        { error: { code: 'REFRESH_TOKEN_MISMATCH', message: 'Refresh token does not match stored value' } },
        { status: 401 }
      );
    }

    await redis.del(refreshKey);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const role = user?.role || 'STUDENT';

    const newSessionId = generateSessionId();
    const newAccessToken = await signAccessToken(userId, role, newSessionId);
    const newRefreshToken = await signRefreshToken(userId, newSessionId);

    const newRefreshKey = buildRefreshTokenRedisKey(newSessionId);
    const newRefreshHash = hashRefreshToken(newRefreshToken);
    await redis.set(newRefreshKey, newRefreshHash, 'EX', 7 * 24 * 60 * 60);

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error('[Refresh Token] Error:', err);
    return NextResponse.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable. Please try again.' } },
      { status: 503 }
    );
  }
}
