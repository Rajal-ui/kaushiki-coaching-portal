import { NextResponse } from 'next/server';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { buildRefreshTokenRedisKey } from '@/lib/auth/otp';
import { redis } from '@/lib/redis';

export async function POST(req: AuthenticatedRequest) {
  const authResult = await authenticateRequest(req);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;

  const refreshKey = buildRefreshTokenRedisKey(user.sessionId);
  await redis.del(refreshKey);

  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
