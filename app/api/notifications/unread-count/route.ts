import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  try {
    const count = await prisma.notification.count({
      where: { userId: auth.user.id, isRead: false },
    });

    return NextResponse.json({ count });
  } catch (err) {
    console.error('[Unread Count] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to get unread count' } },
      { status: 500 }
    );
  }
}
