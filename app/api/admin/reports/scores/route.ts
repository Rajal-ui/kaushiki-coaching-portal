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
  const batchId = url.searchParams.get('batchId');
  const format = url.searchParams.get('format');

  if (!batchId) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'batchId query param required' } }, { status: 400 });
  }

  try {
    const testScores = await prisma.testScore.findMany({
      where: { batchId },
      select: {
        id: true,
        studentId: true,
        testName: true,
        score: true,
        maxScore: true,
        testDate: true,
        student: { select: { name: true, phone: true } },
      },
      orderBy: [{ studentId: 'asc' }, { testDate: 'asc' }],
    });

    const studentScores = new Map<string, {
      name: string;
      phone: string;
      tests: { score: number; maxScore: number; testDate: Date }[];
    }>();

    for (const t of testScores) {
      if (!studentScores.has(t.studentId)) {
        studentScores.set(t.studentId, { name: t.student.name, phone: t.student.phone ?? '', tests: [] });
      }
      studentScores.get(t.studentId)!.tests.push({ score: t.score, maxScore: t.maxScore, testDate: t.testDate });
    }

    const data = Array.from(studentScores.entries()).map(([studentId, stats]) => {
      const percentages = stats.tests.map((t) => (t.score / t.maxScore) * 100);
      const avgScore = percentages.length > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length * 100) / 100 : 0;
      const highest = percentages.length > 0 ? Math.round(Math.max(...percentages) * 100) / 100 : 0;
      const lowest = percentages.length > 0 ? Math.round(Math.min(...percentages) * 100) / 100 : 0;

      let trend = 0;
      if (percentages.length >= 2) {
        const half = Math.floor(percentages.length / 2);
        const firstHalf = percentages.slice(0, half).reduce((a, b) => a + b, 0) / half;
        const secondHalf = percentages.slice(half).reduce((a, b) => a + b, 0) / (percentages.length - half);
        trend = Math.round((secondHalf - firstHalf) * 100) / 100;
      }

      return {
        studentId,
        studentName: stats.name,
        phone: stats.phone,
        testsTaken: stats.tests.length,
        avgScore,
        highest,
        lowest,
        trend,
      };
    });

    if (format === 'csv') {
      const csv = stringify(data, { header: true });
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="scores-report.csv"',
        },
      });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[Scores Report] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to generate report' } }, { status: 500 });
  }
}
