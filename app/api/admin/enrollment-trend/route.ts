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

    const enrollments = await prisma.enrollment.findMany({
      where: { enrolledAt: { gte: startDate } },
      select: { enrolledAt: true },
      orderBy: { enrolledAt: 'asc' },
    });

    const countMap = new Map<string, number>();
    for (let i = 0; i < months; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      countMap.set(key, 0);
    }

    for (const e of enrollments) {
      const key = `${e.enrolledAt.getFullYear()}-${String(e.enrolledAt.getMonth() + 1).padStart(2, '0')}`;
      countMap.set(key, (countMap.get(key) || 0) + 1);
    }

    const data = Array.from(countMap.entries()).map(([month, count]) => ({ month, count }));

    return NextResponse.json(data);
  } catch (err) {
    console.error('[Enrollment Trend] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch enrollment trend' } }, { status: 500 });
  }
}
