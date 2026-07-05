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
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      include: {
        payer: { select: { id: true, name: true, phone: true, email: true } },
        enrollment: {
          select: {
            student: { select: { id: true, name: true, phone: true } },
            batch: { select: { subject: { select: { name: true, track: { select: { name: true } } } } } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const data = payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      gateway: p.gateway,
      payerName: p.payer.name,
      payerPhone: p.payer.phone,
      payerEmail: p.payer.email,
      studentName: p.enrollment.student.name,
      studentPhone: p.enrollment.student.phone,
      track: p.enrollment.batch.subject.track.name,
      subject: p.enrollment.batch.subject.name,
      createdAt: p.createdAt.toISOString(),
    }));

    if (format === 'csv') {
      const csv = stringify(data, { header: true });
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="revenue-report.csv"',
        },
      });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[Revenue Report] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to generate report' } }, { status: 500 });
  }
}
