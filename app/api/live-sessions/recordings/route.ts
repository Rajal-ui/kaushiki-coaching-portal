import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const batchId = url.searchParams.get('batchId');

  try {
    const where: Record<string, unknown> = { published: true };

    if (auth.user.role === 'STUDENT') {
      if (batchId) {
        const enrollment = await prisma.enrollment.findUnique({
          where: { studentId_batchId: { studentId: auth.user.id, batchId } },
        });
        if (!enrollment || enrollment.status !== 'ACTIVE') {
          return NextResponse.json(
            { error: { code: 'FORBIDDEN', message: 'Not enrolled in this batch' } },
            { status: 403 }
          );
        }
        where.batchId = batchId;
      } else {
        const enrollments = await prisma.enrollment.findMany({
          where: { studentId: auth.user.id, status: 'ACTIVE' },
          select: { batchId: true },
        });
        where.batchId = { in: enrollments.map(e => e.batchId) };
      }
    } else if (auth.user.role === 'FACULTY') {
      if (batchId) {
        const batch = await prisma.batch.findUnique({ where: { id: batchId }, select: { facultyId: true } });
        if (!batch || batch.facultyId !== auth.user.id) {
          return NextResponse.json(
            { error: { code: 'FORBIDDEN', message: 'Not your batch' } },
            { status: 403 }
          );
        }
        where.batchId = batchId;
      } else {
        where.facultyId = auth.user.id;
      }
    } else if (auth.user.role === 'ADMIN') {
      if (batchId) where.batchId = batchId;
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

    const recordings = await prisma.recording.findMany({
      where,
      include: {
        batch: { select: { id: true, subject: { select: { name: true } } } },
        session: { select: { id: true, title: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ data: recordings });
  } catch (err) {
    console.error('[List Recordings] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch recordings' } },
      { status: 500 }
    );
  }
}
