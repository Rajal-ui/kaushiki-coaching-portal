import { NextResponse } from 'next/server';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { buildRefreshTokenRedisKey } from '@/lib/auth/otp';
import { redis } from '@/lib/redis';

export async function POST(req: AuthenticatedRequest) {
  const authResult = await authenticateRequest(req);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;

  try {
    const refreshKey = buildRefreshTokenRedisKey(user.sessionId);
    await redis.del(refreshKey);

    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('[Logout] Error:', err);
    return NextResponse.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable. Please try again.' } },
      { status: 503 }
    );
  }
}
