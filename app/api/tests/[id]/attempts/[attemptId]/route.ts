import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { attemptAnswerSchema } from '@/lib/validators/tests';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attemptId: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  const { attemptId } = await params;

  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        test: {
          include: {
            questions: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Attempt not found' } },
        { status: 404 }
      );
    }

    if (auth.user.role === 'STUDENT' && attempt.studentId !== auth.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    if (auth.user.role === 'STUDENT' && attempt.status === 'STARTED') {
      const sanitizedQuestions = attempt.test.questions.map(q => {
        const { correctOption, ...rest } = q;
        return rest;
      });
      attempt.test.questions = sanitizedQuestions as any;
    }

    return NextResponse.json(attempt);
  } catch (err) {
    console.error('[Get Attempt] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch attempt' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attemptId: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  if (auth.user.role !== 'STUDENT') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only students can submit answers' } },
      { status: 403 }
    );
  }

  const { id: testId, attemptId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = attemptAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  try {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: true },
    });

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!test || !attempt) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Test or Attempt not found' } },
        { status: 404 }
      );
    }

    if (attempt.studentId !== auth.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'This is not your attempt' } },
        { status: 403 }
      );
    }

    if (attempt.status !== 'STARTED') {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Attempt is already finished' } },
        { status: 400 }
      );
    }

    const { action, answers } = parsed.data;
    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - new Date(attempt.startTime).getTime()) / 1000);
    const limitSeconds = test.timeLimit * 60;
    
    const isExpired = elapsedSeconds > limitSeconds + 10;
    const finalStatus = isExpired ? 'TIMEOUT' : 'COMPLETED';

    if (action === 'save_answers' && isExpired) {
      return await forceSubmitAttempt(attemptId, test, auth.user.id, limitSeconds);
    }

    if (action === 'save_answers') {
      await prisma.$transaction(async (tx) => {
        for (const ans of answers) {
          await tx.testAnswer.upsert({
            where: { attemptId_questionId: { attemptId, questionId: ans.questionId } },
            update: {
              selectedOption: ans.selectedOption || null,
              subjectiveAnswer: ans.subjectiveAnswer || null,
            },
            create: {
              attemptId,
              questionId: ans.questionId,
              selectedOption: ans.selectedOption || null,
              subjectiveAnswer: ans.subjectiveAnswer || null,
            },
          });
        }
      });

      return NextResponse.json({ success: true, remainingSeconds: limitSeconds - elapsedSeconds });
    }

    const result = await prisma.$transaction(async (tx) => {
      for (const ans of answers) {
        await tx.testAnswer.upsert({
          where: { attemptId_questionId: { attemptId, questionId: ans.questionId } },
          update: {
            selectedOption: ans.selectedOption || null,
            subjectiveAnswer: ans.subjectiveAnswer || null,
          },
          create: {
            attemptId,
            questionId: ans.questionId,
            selectedOption: ans.selectedOption || null,
            subjectiveAnswer: ans.subjectiveAnswer || null,
          },
        });
      }

      const dbAnswers = await tx.testAnswer.findMany({
        where: { attemptId },
      });

      let score = 0;
      let allMCQGraded = true;

      for (const q of test.questions) {
        const answer = dbAnswers.find(a => a.questionId === q.id);
        if (q.type === 'MCQ') {
          const selected = answer?.selectedOption;
          const isCorrect = selected === q.correctOption;
          const marks = isCorrect ? q.marks : 0;
          score += marks;

          await tx.testAnswer.upsert({
            where: { attemptId_questionId: { attemptId, questionId: q.id } },
            update: { marksObtained: marks, isGraded: true },
            create: {
              attemptId,
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
                attemptId,
                questionId: q.id,
                isGraded: false,
              },
            });
          }
        }
      }

      const updated = await tx.testAttempt.update({
        where: { id: attemptId },
        data: {
          status: finalStatus,
          endTime: isExpired ? new Date(new Date(attempt.startTime).getTime() + limitSeconds * 1000) : now,
          score: allMCQGraded ? score : null,
        },
      });

      if (allMCQGraded) {
        const existingScore = await tx.testScore.findFirst({
          where: { batchId: test.batchId, studentId: auth.user.id, testName: test.title },
        });
        if (!existingScore) {
          await tx.testScore.create({
            data: {
              batchId: test.batchId,
              studentId: auth.user.id,
              testName: test.title,
              score: score,
              maxScore: test.totalMarks,
              testDate: now,
              remark: 'Auto-graded online quiz',
            },
          });
        }
      }

      return updated;
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[Submit Attempt] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to submit attempt' } },
      { status: 500 }
    );
  }
}

async function forceSubmitAttempt(attemptId: string, test: any, studentId: string, limitSeconds: number) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const dbAnswers = await tx.testAnswer.findMany({
        where: { attemptId },
      });

      let score = 0;
      let allMCQGraded = true;

      for (const q of test.questions) {
        const answer = dbAnswers.find(a => a.questionId === q.id);
        if (q.type === 'MCQ') {
          const selected = answer?.selectedOption;
          const isCorrect = selected === q.correctOption;
          const marks = isCorrect ? q.marks : 0;
          score += marks;

          await tx.testAnswer.upsert({
            where: { attemptId_questionId: { attemptId, questionId: q.id } },
            update: { marksObtained: marks, isGraded: true },
            create: {
              attemptId,
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
                attemptId,
                questionId: q.id,
                isGraded: false,
              },
            });
          }
        }
      }

      const attempt = await tx.testAttempt.findUnique({ where: { id: attemptId } });
      const updated = await tx.testAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'TIMEOUT',
          endTime: attempt ? new Date(new Date(attempt.startTime).getTime() + limitSeconds * 1000) : new Date(),
          score: allMCQGraded ? score : null,
        },
      });

      if (allMCQGraded) {
        const existingScore = await tx.testScore.findFirst({
          where: { batchId: test.batchId, studentId, testName: test.title },
        });
        if (!existingScore) {
          await tx.testScore.create({
            data: {
              batchId: test.batchId,
              studentId,
              testName: test.title,
              score: score,
              maxScore: test.totalMarks,
              testDate: new Date(),
              remark: 'Auto-graded online quiz (timeout forced)',
            },
          });
        }
      }

      return updated;
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[Force Submit Attempt] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to force submit attempt' } },
      { status: 500 }
    );
  }
}
