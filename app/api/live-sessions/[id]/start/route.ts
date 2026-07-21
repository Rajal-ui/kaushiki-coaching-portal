import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const session = await prisma.liveSession.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Live session not found' } },
        { status: 404 }
      );
    }

    if (session.facultyId !== auth.user.id && auth.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Only the faculty can start this session' } },
        { status: 403 }
      );
    }

    if (session.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: { code: 'INVALID_STATUS', message: 'Session must be in SCHEDULED status to start' } },
        { status: 400 }
      );
    }

    const updated = await prisma.liveSession.update({
      where: { id },
      data: { status: 'LIVE', actualStart: new Date() },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('[Start LiveSession] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to start session' } },
      { status: 500 }
    );
  }
}
