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
        { error: { code: 'FORBIDDEN', message: 'Only the faculty can end this session' } },
        { status: 403 }
      );
    }

    if (session.status !== 'LIVE') {
      return NextResponse.json(
        { error: { code: 'INVALID_STATUS', message: 'Session must be LIVE to end' } },
        { status: 400 }
      );
    }

    const now = new Date();
    const duration = session.actualStart
      ? Math.floor((now.getTime() - session.actualStart.getTime()) / 1000)
      : null;

    const updated = await prisma.liveSession.update({
      where: { id },
      data: { status: 'COMPLETED', actualEnd: now },
    });

    if (duration) {
      await prisma.liveSessionAttendance.updateMany({
        where: { sessionId: id, leftAt: null },
        data: { leftAt: now, duration },
      });
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('[End LiveSession] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to end session' } },
      { status: 500 }
    );
  }
}
