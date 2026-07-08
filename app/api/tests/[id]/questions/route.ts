import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { questionsBulkSchema } from '@/lib/validators/tests';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  if (auth.user.role !== 'FACULTY' && auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Access denied' } },
      { status: 403 }
    );
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = questionsBulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  try {
    const test = await prisma.test.findUnique({
      where: { id },
      include: { _count: { select: { attempts: true } } },
    });

    if (!test) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Test not found' } },
        { status: 404 }
      );
    }

    if (auth.user.role === 'FACULTY' && test.facultyId !== auth.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You do not own this test' } },
        { status: 403 }
      );
    }

    if (test._count.attempts > 0) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Cannot modify questions for a test that already has attempts' } },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.question.deleteMany({ where: { testId: id } });

      const created = [];
      let totalMarks = 0;
      for (const q of parsed.data.questions) {
        totalMarks += q.marks;
        const question = await tx.question.create({
          data: {
            testId: id,
            type: q.type,
            questionText: q.questionText,
            options: q.options || undefined,
            correctOption: q.correctOption || null,
            marks: q.marks,
            displayOrder: q.displayOrder,
          },
        });
        created.push(question);
      }

      await tx.test.update({
        where: { id },
        data: { totalMarks },
      });

      return created;
    });

    return NextResponse.json({ data: result, count: result.length });
  } catch (err) {
    console.error('[Set Questions] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to set questions' } },
      { status: 500 }
    );
  }
}

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
    } else if (auth.user.role === 'FACULTY') {
      const batch = await prisma.batch.findUnique({ where: { id: test.batchId }, select: { facultyId: true } });
      if (test.facultyId !== auth.user.id && batch?.facultyId !== auth.user.id) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Access denied' } },
          { status: 403 }
        );
      }
    }

    const questions = await prisma.question.findMany({
      where: { testId: id },
      orderBy: { displayOrder: 'asc' },
    });

    if (auth.user.role === 'STUDENT') {
      const attempt = await prisma.testAttempt.findFirst({
        where: { testId: id, studentId: auth.user.id },
      });

      const hasEnded = attempt && (
        attempt.status === 'COMPLETED' ||
        attempt.status === 'TIMEOUT' ||
        (attempt.endTime !== null && attempt.endTime !== undefined) ||
        (Date.now() - new Date(attempt.startTime).getTime() > (test.timeLimit * 60 * 1000 + 10000))
      );

      if (!hasEnded) {
        const sanitizedQuestions = questions.map(q => {
          const { correctOption, ...rest } = q;
          return rest;
        });
        return NextResponse.json({ data: sanitizedQuestions });
      }
    }

    return NextResponse.json({ data: questions });
  } catch (err) {
    console.error('[Get Questions] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch questions' } },
      { status: 500 }
    );
  }
}
