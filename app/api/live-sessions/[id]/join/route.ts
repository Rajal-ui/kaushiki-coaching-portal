import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'STUDENT') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only students can join sessions' } },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;

    const session = await prisma.liveSession.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Live session not found' } },
        { status: 404 }
      );
    }

    if (session.status === 'CANCELLED') {
      return NextResponse.json(
        { error: { code: 'SESSION_CANCELLED', message: 'This session has been cancelled' } },
        { status: 400 }
      );
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_batchId: { studentId: auth.user.id, batchId: session.batchId } },
    });
    if (!enrollment || enrollment.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: { code: 'NOT_ENROLLED', message: 'You are not enrolled in this batch' } },
        { status: 403 }
      );
    }

    const existing = await prisma.liveSessionAttendance.findUnique({
      where: { sessionId_studentId: { sessionId: id, studentId: auth.user.id } },
    });

    if (!existing) {
      await prisma.liveSessionAttendance.create({
        data: {
          sessionId: id,
          studentId: auth.user.id,
          source: 'click',
        },
      });
    }

    return NextResponse.json({
      data: {
        meetingUrl: session.meetingUrl,
        meetingId: session.meetingId,
        passcode: session.passcode,
        platform: session.platform,
      },
    });
  } catch (err) {
    console.error('[Join LiveSession] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to join session' } },
      { status: 500 }
    );
  }
}
