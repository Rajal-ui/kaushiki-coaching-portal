import { NextRequest, NextResponse } from 'next/server';
import { stringify } from 'csv-stringify/sync';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin only' } }, { status: 403 });
  }

  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const format = url.searchParams.get('format');

  if (!from || !to) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'from and to query params required' } }, { status: 400 });
  }

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        enrolledAt: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      include: {
        student: { select: { id: true, name: true, phone: true, email: true } },
        batch: {
          select: {
            subject: { select: { name: true, track: { select: { name: true } } } },
            faculty: { select: { name: true } },
          },
        },
        payment: { select: { status: true, amount: true } },
      },
      orderBy: { enrolledAt: 'asc' },
    });

    const data = enrollments.map((e) => ({
      id: e.id,
      studentName: e.student.name,
      studentPhone: e.student.phone,
      studentEmail: e.student.email,
      track: e.batch.subject.track.name,
      subject: e.batch.subject.name,
      faculty: e.batch.faculty.name,
      status: e.status,
      paymentStatus: e.payment?.status || 'NONE',
      paymentAmount: e.payment?.amount || 0,
      enrolledAt: e.enrolledAt.toISOString(),
    }));

    if (format === 'csv') {
      const csv = stringify(data, { header: true });
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="enrollments-report.csv"',
        },
      });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[Enrollment Report] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to generate report' } }, { status: 500 });
  }
}
