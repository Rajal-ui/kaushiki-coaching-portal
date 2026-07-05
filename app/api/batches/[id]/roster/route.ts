import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  if (auth.user.role !== 'ADMIN' && auth.user.role !== 'FACULTY') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
      { status: 403 }
    );
  }

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

    if (auth.user.role === 'FACULTY' && batch.faculty.id !== auth.user.id) {
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
}
