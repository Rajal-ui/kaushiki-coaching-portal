import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const test = await prisma.test.findUnique({
      where: { id },
      select: { title: true, totalMarks: true, batchId: true, status: true },
    });

    if (!test) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Test not found' } },
        { status: 404 }
      );
    }

    if (auth.user.role === 'STUDENT') {
      const enrolled = await prisma.enrollment.findFirst({
        where: { studentId: auth.user.id, batchId: test.batchId, status: 'ACTIVE' },
      });
      if (!enrolled || test.status !== 'PUBLISHED') {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Access denied' } },
          { status: 403 }
        );
      }
    }

    const attempts = await prisma.testAttempt.findMany({
      where: { testId: id, score: { not: null } },
      include: {
        student: { select: { name: true, id: true } },
      },
    });

    const attemptsWithTime = attempts.map(a => {
      const durationSeconds = a.endTime && a.startTime
        ? Math.floor((new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) / 1000)
        : 0;
      return {
        ...a,
        durationSeconds,
      };
    });

    attemptsWithTime.sort((a, b) => {
      if (b.score! !== a.score!) {
        return b.score! - a.score!;
      }
      return a.durationSeconds - b.durationSeconds;
    });

    let rank = 1;
    const rankings = attemptsWithTime.map((a, i) => {
      if (i > 0 && attemptsWithTime[i - 1].score! > a.score!) {
        rank = i + 1;
      }
      return {
        studentId: a.studentId,
        studentName: a.student.name,
        score: a.score!,
        percentage: parseFloat(((a.score! / test.totalMarks) * 100).toFixed(1)),
        durationSeconds: a.durationSeconds,
        rank,
      };
    });

    const scores = attempts.map(a => a.score!);
    const totalParticipants = attempts.length;
    const highestScore = totalParticipants > 0 ? Math.max(...scores) : 0;
    const lowestScore = totalParticipants > 0 ? Math.min(...scores) : 0;
    const averageScore = totalParticipants > 0
      ? parseFloat((scores.reduce((sum, s) => sum + s, 0) / totalParticipants).toFixed(1))
      : 0;

    const passingCount = attempts.filter(a => (a.score! / test.totalMarks) >= 0.5).length;
    const passRate = totalParticipants > 0
      ? parseFloat(((passingCount / totalParticipants) * 100).toFixed(1))
      : 0;

    return NextResponse.json({
      test: {
        title: test.title,
        totalMarks: test.totalMarks,
      },
      stats: {
        totalParticipants,
        averageScore,
        highestScore,
        lowestScore,
        passRate,
      },
      leaderboard: rankings,
    });
  } catch (err) {
    console.error('[Get Leaderboard] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch leaderboard' } },
      { status: 500 }
    );
  }
}
