import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  if (auth.user.role !== 'STUDENT') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only students have personal test analytics' } },
      { status: 403 }
    );
  }

  try {
    const attempts = await prisma.testAttempt.findMany({
      where: {
        studentId: auth.user.id,
        status: { in: ['COMPLETED', 'TIMEOUT'] },
        score: { not: null },
      },
      include: {
        test: {
          include: {
            batch: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
      orderBy: { endTime: 'asc' },
    });

    const totalAttempts = attempts.length;
    const percentages = attempts.map(a => (a.score! / a.test.totalMarks) * 100);
    
    const averagePercentage = totalAttempts > 0
      ? parseFloat((percentages.reduce((sum, p) => sum + p, 0) / totalAttempts).toFixed(1))
      : 0;

    const highestPercentage = totalAttempts > 0
      ? parseFloat(Math.max(...percentages).toFixed(1))
      : 0;

    const recentTrend = attempts.map(a => ({
      date: a.endTime ? new Date(a.endTime).toLocaleDateString() : new Date(a.createdAt).toLocaleDateString(),
      score: a.score!,
      maxScore: a.test.totalMarks,
      testName: a.test.title,
      percentage: parseFloat(((a.score! / a.test.totalMarks) * 100).toFixed(1)),
    }));

    const subjectGroups: Record<string, { total: number; count: number }> = {};
    attempts.forEach(a => {
      const subjectName = a.test.batch.subject.name;
      const pct = (a.score! / a.test.totalMarks) * 100;
      if (!subjectGroups[subjectName]) {
        subjectGroups[subjectName] = { total: pct, count: 1 };
      } else {
        subjectGroups[subjectName].total += pct;
        subjectGroups[subjectName].count += 1;
      }
    });

    const bySubject = Object.entries(subjectGroups).map(([subject, info]) => ({
      subject,
      percentage: parseFloat((info.total / info.count).toFixed(1)),
    }));

    return NextResponse.json({
      summary: {
        totalAttempts,
        averagePercentage,
        highestPercentage,
      },
      recentTrend,
      bySubject,
    });
  } catch (err) {
    console.error('[Student Analytics] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch student analytics' } },
      { status: 500 }
    );
  }
}
