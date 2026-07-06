import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin only' } }, { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || '';
  const search = url.searchParams.get('search') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)), 100);
  const skip = (page - 1) * limit;

  try {
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { payer: { name: { contains: search, mode: 'insensitive' } } },
        { payer: { phone: { contains: search } } },
        { enrollment: { batch: { subject: { name: { contains: search, mode: 'insensitive' } } } } },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          gateway: true,
          gatewayOrderId: true,
          gatewayEventId: true,
          failureReason: true,
          createdAt: true,
          updatedAt: true,
          payer: { select: { id: true, name: true, phone: true } },
          enrollment: {
            select: {
              id: true,
              batch: {
                select: {
                  id: true,
                  subject: { select: { name: true } },
                  schedule: true,
                },
              },
              student: { select: { name: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    const data = payments.map(p => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      gateway: p.gateway,
      gatewayOrderId: p.gatewayOrderId,
      gatewayEventId: p.gatewayEventId,
      failureReason: p.failureReason,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      payer: p.payer,
      student: p.enrollment?.student || null,
      batchSubject: p.enrollment?.batch?.subject?.name || null,
      batchSchedule: p.enrollment?.batch?.schedule || null,
    }));

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Admin Payments] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch payments' } }, { status: 500 });
  }
}
