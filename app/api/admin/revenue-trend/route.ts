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
  const months = Math.min(parseInt(url.searchParams.get('months') || '6', 10), 36);

  try {
    const endDate = new Date();
    endDate.setDate(1);
    endDate.setHours(0, 0, 0, 0);
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - months + 1);

    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCEEDED',
        createdAt: { gte: startDate },
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const revenueMap = new Map<string, number>();
    for (let i = 0; i < months; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueMap.set(key, 0);
    }

    for (const p of payments) {
      const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, '0')}`;
      revenueMap.set(key, (revenueMap.get(key) || 0) + p.amount);
    }

    const data = Array.from(revenueMap.entries()).map(([month, revenue]) => ({ month, revenue }));

    return NextResponse.json(data);
  } catch (err) {
    console.error('[Revenue Trend] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch revenue trend' } }, { status: 500 });
  }
}
