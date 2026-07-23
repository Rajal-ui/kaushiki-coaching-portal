import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest, withRole } from '@/lib/auth/middleware';

export const POST = withRole('STUDENT', async (
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
): Promise<NextResponse> => {
  const user = (req as AuthenticatedRequest).user!;
  const { id } = await params as { id: string };

  try {
    const test = await prisma.test.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!test || test.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Test not found or not published' } },
        { status: 404 }
      );
    }

    const enrolled = await prisma.enrollment.findFirst({
      where: { studentId: user.id, batchId: test.batchId, status: 'ACTIVE' },
    });
    if (!enrolled) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You are not enrolled in the batch for this test' } },
        { status: 403 }
      );
    }

    let attempt = await prisma.testAttempt.findFirst({
      where: { testId: id, studentId: user.id },
      include: { answers: true },
    });

    const now = new Date();

    if (!attempt) {
      try {
        attempt = await prisma.testAttempt.create({
          data: {
            testId: id,
            studentId: user.id,
            startTime: now,
            status: 'STARTED',
          },
          include: { answers: true },
        });
      } catch (err) {
        if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
          attempt = await prisma.testAttempt.findFirst({
            where: { testId: id, studentId: user.id },
            include: { answers: true },
          });
          if (!attempt) throw err;
        } else {
          throw err;
        }
      }
    } else if (attempt.status === 'STARTED') {
      const elapsedSeconds = Math.floor((now.getTime() - new Date(attempt.startTime).getTime()) / 1000);
      const limitSeconds = test.timeLimit * 60;

      if (elapsedSeconds > limitSeconds + 10) {
        attempt = await prisma.$transaction(async (tx) => {
          const answers = await tx.testAnswer.findMany({
            where: { attemptId: attempt!.id },
          });

          let score = 0;
          let allMCQGraded = true;

          for (const q of test.questions) {
            const answer = answers.find(a => a.questionId === q.id);
            if (q.type === 'MCQ') {
              const selected = answer?.selectedOption;
              const isCorrect = selected === q.correctOption;
              const marks = isCorrect ? q.marks : 0;
              score += marks;

              await tx.testAnswer.upsert({
                where: { attemptId_questionId: { attemptId: attempt!.id, questionId: q.id } },
                update: { marksObtained: marks, isGraded: true },
                create: {
                  attemptId: attempt!.id,
                  questionId: q.id,
                  selectedOption: selected || null,
                  marksObtained: marks,
                  isGraded: true,
                },
              });
            } else {
              allMCQGraded = false;
              if (!answer) {
                await tx.testAnswer.create({
                  data: {
                    attemptId: attempt!.id,
                    questionId: q.id,
                    isGraded: false,
                  },
                });
              }
            }
          }

          const updatedAttempt = await tx.testAttempt.update({
            where: { id: attempt!.id },
            data: {
              status: 'TIMEOUT',
              endTime: new Date(new Date(attempt!.startTime).getTime() + limitSeconds * 1000),
              score: allMCQGraded ? score : null,
            },
            include: { answers: true },
          });

          if (allMCQGraded) {
            const existingScore = await tx.testScore.findFirst({
              where: { batchId: test.batchId, studentId: user.id, testName: test.title },
            });
            if (!existingScore) {
              await tx.testScore.create({
                data: {
                  batchId: test.batchId,
                  studentId: user.id,
                  testName: test.title,
                  score: score,
                  maxScore: test.totalMarks,
                  testDate: now,
                  remark: 'Auto-graded online quiz (timeout)',
                },
              });
            }
          }

          return updatedAttempt;
        });
      }
    }

    return NextResponse.json(attempt);
  } catch (err) {
    console.error('[Start/Resume Attempt] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to start or resume attempt' } },
      { status: 500 }
    );
  }
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    if (auth.user.role === 'STUDENT') {
      const attempt = await prisma.testAttempt.findFirst({
        where: { testId: id, studentId: auth.user.id },
        include: { answers: true },
      });
      return NextResponse.json({ data: attempt ? [attempt] : [] });
    } else if (auth.user.role === 'FACULTY' || auth.user.role === 'ADMIN') {
      const attempts = await prisma.testAttempt.findMany({
        where: { testId: id },
        include: {
          student: { select: { id: true, name: true, phone: true } },
          answers: true,
        },
        orderBy: { startTime: 'desc' },
      });
      return NextResponse.json({ data: attempts });
    }

    return NextResponse.json({ data: [] });
  } catch (err) {
    console.error('[List Attempts] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch attempts' } },
      { status: 500 }
    );
  }
}
