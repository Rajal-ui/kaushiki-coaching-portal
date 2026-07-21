import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { createLiveSessionSchema, listLiveSessionsSchema } from '@/lib/validators/live-sessions';
import { createNotificationForLiveSession } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const query = listLiveSessionsSchema.safeParse({
    batchId: url.searchParams.get('batchId') || undefined,
    status: url.searchParams.get('status') || undefined,
    fromDate: url.searchParams.get('fromDate') || undefined,
    toDate: url.searchParams.get('toDate') || undefined,
    page: url.searchParams.get('page') || '1',
    limit: url.searchParams.get('limit') || '20',
  });

  if (!query.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: query.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { batchId, status, fromDate, toDate, page, limit } = query.data;

  try {
    const where: Record<string, unknown> = {};

    if (auth.user.role === 'FACULTY') {
      where.facultyId = auth.user.id;
    } else if (auth.user.role === 'STUDENT') {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: auth.user.id, status: 'ACTIVE' },
        select: { batchId: true },
      });
      where.batchId = { in: enrollments.map(e => e.batchId) };
    } else if (auth.user.role === 'PARENT') {
      const studentId = url.searchParams.get('studentId');
      if (!studentId) {
        return NextResponse.json(
          { error: { code: 'STUDENT_REQUIRED', message: 'Parent must specify a student ID' } },
          { status: 400 }
        );
      }
      const link = await prisma.parentStudentLink.findUnique({
        where: { parentId_studentId: { parentId: auth.user.id, studentId } },
      });
      if (!link || link.status !== 'APPROVED') {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Not linked to this student' } },
          { status: 403 }
        );
      }
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId, status: 'ACTIVE' },
        select: { batchId: true },
      });
      where.batchId = { in: enrollments.map(e => e.batchId) };
    }

    if (batchId) where.batchId = batchId;
    if (status) where.status = status;
    if (fromDate || toDate) {
      where.scheduledStart = {};
      if (fromDate) (where.scheduledStart as Record<string, unknown>).gte = new Date(fromDate);
      if (toDate) (where.scheduledStart as Record<string, unknown>).lte = new Date(toDate);
    }

    const [sessions, total] = await Promise.all([
      prisma.liveSession.findMany({
        where,
        include: {
          batch: {
            select: {
              id: true,
              subject: { select: { id: true, name: true, track: { select: { name: true } } } },
            },
          },
          _count: { select: { attendance: true } },
        },
        orderBy: { scheduledStart: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.liveSession.count({ where }),
    ]);

    return NextResponse.json({
      data: sessions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[List LiveSessions] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch live sessions' } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'FACULTY' && auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only faculty and admins can create live sessions' } },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = createLiveSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  try {
    const { batchId, platform, meetingUrl, meetingId, passcode, scheduledStart, scheduledEnd, title, description, isRecurring, recurringPattern } = parsed.data;

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Batch not found' } },
        { status: 404 }
      );
    }

    if (auth.user.role === 'FACULTY' && batch.facultyId !== auth.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You are not the faculty for this batch' } },
        { status: 403 }
      );
    }

    const facultyId = auth.user.role === 'FACULTY' ? auth.user.id : batch.facultyId;

    const session = await prisma.liveSession.create({
      data: {
        batchId,
        facultyId,
        title: title || null,
        description: description || null,
        platform,
        meetingUrl,
        meetingId: meetingId || null,
        passcode: passcode || null,
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: new Date(scheduledEnd),
        isRecurring: isRecurring || false,
        recurringPattern: recurringPattern || undefined,
      },
      include: {
        batch: {
          select: {
            id: true,
            subject: { select: { name: true } },
          },
        },
      },
    });

    await createNotificationForLiveSession(session.id);

    return NextResponse.json({ data: session }, { status: 201 });
  } catch (err) {
    console.error('[Create LiveSession] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create live session' } },
      { status: 500 }
    );
  }
}
