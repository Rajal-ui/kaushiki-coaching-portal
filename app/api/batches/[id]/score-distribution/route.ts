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

    const scores = await prisma.testScore.findMany({
      where: { batchId: id },
      select: { testName: true, score: true, maxScore: true },
      orderBy: { testDate: 'asc' },
    });

    const byTest = new Map<string, { scores: number[]; maxScores: number[] }>();
    for (const s of scores) {
      const entry = byTest.get(s.testName) || { scores: [], maxScores: [] };
      entry.scores.push(s.score);
      entry.maxScores.push(s.maxScore);
      byTest.set(s.testName, entry);
    }

    const data = Array.from(byTest.entries()).map(([testName, { scores, maxScores }]) => {
      const avgScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
      const maxScore = Math.max(...maxScores);
      return { testName, averageScore: avgScore, maxScore };
    });

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[Score Distribution] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch score distribution' } },
      { status: 500 }
    );
  }
});
