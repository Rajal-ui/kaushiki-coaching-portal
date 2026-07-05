import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

export async function GET(req: AuthenticatedRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'STUDENT') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only students can view their enrollments' } },
      { status: 403 }
    );
  }

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: auth.user.id },
      include: {
        batch: {
          select: {
            id: true, capacity: true, seatsFilled: true, schedule: true, status: true,
            subject: { select: { id: true, name: true, trackId: true, track: { select: { name: true } } } },
            faculty: { select: { id: true, name: true } },
          },
        },
        payment: { select: { id: true, amount: true, status: true, gatewayOrderId: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return NextResponse.json({ data: enrollments });
  } catch (err) {
    console.error('[My Enrollments] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch enrollments' } },
      { status: 500 }
    );
  }
}
