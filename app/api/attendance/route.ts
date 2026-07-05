import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { listAttendanceSchema } from '@/lib/validators/attendance';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const query = listAttendanceSchema.safeParse({
    batchId: url.searchParams.get('batchId') || undefined,
    studentId: url.searchParams.get('studentId') || undefined,
    fromDate: url.searchParams.get('fromDate') || undefined,
    toDate: url.searchParams.get('toDate') || undefined,
  });

  if (!query.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: query.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { batchId, studentId, fromDate, toDate } = query.data;

  try {
    const where: Record<string, unknown> = {};

    if (auth.user.role === 'STUDENT') {
      where.studentId = auth.user.id;
    } else if (auth.user.role === 'FACULTY') {
      if (batchId) {
        const batch = await prisma.batch.findUnique({ where: { id: batchId }, select: { facultyId: true } });
        if (!batch || batch.facultyId !== auth.user.id) {
          return NextResponse.json(
            { error: { code: 'FORBIDDEN', message: 'Not your batch' } },
            { status: 403 }
          );
        }
      }
      where.batchId = batchId;
    } else if (auth.user.role === 'ADMIN') {
      if (batchId) where.batchId = batchId;
      if (studentId) where.studentId = studentId;
    } else if (auth.user.role === 'PARENT') {
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
      where.studentId = studentId;
    }

    if (fromDate) {
      where.sessionDate = { ...(where.sessionDate as Record<string, unknown> || {}), gte: new Date(fromDate) };
    }
    if (toDate) {
      where.sessionDate = { ...(where.sessionDate as Record<string, unknown> || {}), lte: new Date(toDate) };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        student: { select: { id: true, name: true } },
        batch: { select: { id: true, subject: { select: { name: true } } } },
      },
      orderBy: { sessionDate: 'desc' },
    });

    return NextResponse.json({ data: records });
  } catch (err) {
    console.error('[List Attendance] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch attendance' } },
      { status: 500 }
    );
  }
}
