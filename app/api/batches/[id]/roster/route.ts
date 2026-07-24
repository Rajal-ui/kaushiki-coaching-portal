import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole, type AuthenticatedRequest } from '@/lib/auth/middleware';

export const GET = withRole(['FACULTY', 'ADMIN'], async (req, { params }) => {
  try {
    const { id } = await params;
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        subject: { select: { name: true } },
        faculty: { select: { id: true } },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Batch not found' } },
        { status: 404 }
      );
    }

    const { user } = req as AuthenticatedRequest;
    if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    if (user.role === 'FACULTY' && batch.faculty.id !== user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You are not assigned to this batch' } },
        { status: 403 }
      );
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { batchId: id, status: { in: ['ACTIVE', 'PENDING'] } },
      include: {
        student: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
      orderBy: { enrolledAt: 'asc' },
    });

    return NextResponse.json({
      batch: { id: batch.id, subject: batch.subject.name, seatsFilled: enrollments.length, capacity: batch.capacity },
      students: enrollments.map(e => e.student),
    });
  } catch (err) {
    console.error('[Batch Roster] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch roster' } },
      { status: 500 }
    );
  }
});
