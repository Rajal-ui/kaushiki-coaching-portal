import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/middleware';

export const GET = withRole('ADMIN', async (req) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [activeStudents, openInquiries, monthlyRevenueAgg, batches] = await Promise.all([
      prisma.enrollment.groupBy({
        by: ['studentId'],
        where: { status: 'ACTIVE' },
      }).then((r) => r.length),
      prisma.inquiry.count({
        where: { status: 'NEW' },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'SUCCEEDED',
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.batch.findMany({
        where: { status: 'ACTIVE' },
        select: { capacity: true, seatsFilled: true },
      }),
    ]);

    const batchesNearCapacity = batches.filter((b) => b.seatsFilled >= b.capacity * 0.9).length;

    return NextResponse.json({
      data: {
        activeStudents,
        openInquiries,
        monthlyRevenue: monthlyRevenueAgg._sum.amount ?? 0,
        batchesNearCapacity,
      },
    });
  } catch (err) {
    console.error('[Admin Stats] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stats' } }, { status: 500 });
  }
});
