import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/middleware';

export const GET = withRole(['ADMIN', 'FACULTY'], async (req, ctx) => {
  try {
    const { id } = await ctx.params;

    const batch = await prisma.batch.findUnique({ where: { id } });
    if (!batch) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Batch not found' } },
        { status: 404 }
      );
    }

    const attendance = await prisma.attendance.findMany({
      where: { batchId: id },
      select: { sessionDate: true, present: true },
      orderBy: { sessionDate: 'asc' },
    });

    const byDate = new Map<string, { total: number; present: number }>();
    for (const a of attendance) {
      const key = a.sessionDate.toISOString().split('T')[0];
      const entry = byDate.get(key) || { total: 0, present: 0 };
      entry.total++;
      if (a.present) entry.present++;
      byDate.set(key, entry);
    }

    const data = Array.from(byDate.entries()).map(([date, { total, present }]) => ({
      date,
      percent: total > 0 ? Math.round((present / total) * 10000) / 100 : 0,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[Attendance Trend] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch attendance trend' } },
      { status: 500 }
    );
  }
});
