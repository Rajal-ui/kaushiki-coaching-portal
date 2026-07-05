import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/db/prisma';
import { signAccessToken, signRefreshToken, generateSessionId, hashRefreshToken } from '@/lib/auth/jwt';
import { buildRefreshTokenRedisKey } from '@/lib/auth/otp';
import { redis } from '@/lib/redis';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
  let body: { credential?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  if (!body.credential) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Google credential is required' } },
      { status: 400 }
    );
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: body.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json(
        { error: { code: 'INVALID_GOOGLE_TOKEN', message: 'Could not verify Google identity' } },
        { status: 401 }
      );
    }

    const googleSub = payload.sub;
    const email = payload.email;
    const name = payload.name || email.split('@')[0];

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (user.status === 'SUSPENDED') {
        return NextResponse.json(
          { error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended. Contact support.' } },
          { status: 403 }
        );
      }
    } else {
      const phone = `google_${googleSub}`.slice(0, 20);
      user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash: `google_${googleSub}`,
          role: 'STUDENT',
          status: 'ACTIVE',
          phoneVerified: true,
        },
      });
    }

    if (user.status === 'PENDING_VERIFICATION') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { status: 'ACTIVE' },
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
  } catch (err) {
    console.error('[Google Auth] Error:', err);
    return NextResponse.json(
      { error: { code: 'GOOGLE_AUTH_FAILED', message: 'Google authentication failed. Please try again.' } },
      { status: 401 }
    );
  }
}
