import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { updateLiveSessionSchema } from '@/lib/validators/live-sessions';
import { createNotificationForSessionCancelled } from '@/lib/notifications';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const session = await prisma.liveSession.findUnique({
      where: { id },
      include: {
        batch: {
          select: {
            id: true,
            facultyId: true,
            subject: { select: { id: true, name: true, track: { select: { name: true } } } },
          },
        },
        attendance: {
          include: { student: { select: { id: true, name: true } } },
          orderBy: { joinedAt: 'desc' },
        },
        recordings: { orderBy: { uploadedAt: 'desc' } },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Live session not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: session });
  } catch (err) {
    console.error('[Get LiveSession] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch live session' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = updateLiveSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  try {
    const { id } = await params;

    const existing = await prisma.liveSession.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Live session not found' } },
        { status: 404 }
      );
    }

    if (auth.user.role === 'FACULTY' && existing.facultyId !== auth.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not your session' } },
        { status: 403 }
      );
    }

    const wasCancelled = parsed.data.status === 'CANCELLED' && existing.status !== 'CANCELLED';

    const session = await prisma.liveSession.update({
      where: { id },
      data: parsed.data,
      include: {
        batch: { select: { id: true, subject: { select: { name: true } } } },
      },
    });

    if (wasCancelled) {
      await createNotificationForSessionCancelled(id);
    }

    return NextResponse.json({ data: session });
  } catch (err) {
    console.error('[Update LiveSession] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update live session' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const existing = await prisma.liveSession.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Live session not found' } },
        { status: 404 }
      );
    }

    if (auth.user.role === 'FACULTY' && existing.facultyId !== auth.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not your session' } },
        { status: 403 }
      );
    }

    if (auth.user.role !== 'ADMIN' && auth.user.role !== 'FACULTY') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    await prisma.liveSession.delete({ where: { id } });

    return NextResponse.json({ data: { id }, message: 'Session deleted' });
  } catch (err) {
    console.error('[Delete LiveSession] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete live session' } },
      { status: 500 }
    );
  }
}
