import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { createScoresSchema, listScoresSchema } from '@/lib/validators/scores';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'FACULTY' && auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only faculty and admins can enter scores' } },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = createScoresSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { batchId, testName, testDate, maxScore, scores } = parsed.data;

  try {
    if (auth.user.role === 'FACULTY') {
      const batch = await prisma.batch.findUnique({ where: { id: batchId }, select: { facultyId: true } });
      if (!batch || batch.facultyId !== auth.user.id) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Not your batch' } },
          { status: 403 }
        );
      }
    }

    const date = new Date(testDate);

    const result = await prisma.$transaction(async (tx) => {
      const created = [];

      for (const entry of scores) {
        const score = await tx.testScore.create({
          data: {
            batchId,
            studentId: entry.studentId,
            testName,
            score: entry.score,
            maxScore,
            testDate: date,
            remark: entry.remark,
          },
        });
        created.push(score);
      }

      return created;
    });

    return NextResponse.json({ data: result, count: result.length }, { status: 201 });
  } catch (err) {
    console.error('[Create Scores] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create scores' } },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const query = listScoresSchema.safeParse({
    batchId: url.searchParams.get('batchId') || undefined,
    studentId: url.searchParams.get('studentId') || undefined,
  });

  if (!query.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: query.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { batchId, studentId } = query.data;

  try {
    const where: Record<string, unknown> = {};

    if (auth.user.role === 'STUDENT') {
      where.studentId = auth.user.id;
    } else if (auth.user.role === 'FACULTY') {
      if (batchId) {
        const batch = await prisma.batch.findUnique({ where: { id: batchId }, select: { facultyId: true } });
        if (!batch || batch.facultyId !== auth.user.id) {
          return NextResponse.json(
            { error: { code: 'FORBIDDEN', message: 'Not your batch' } },
            { status: 403 }
          );
        }
      }
      if (batchId) where.batchId = batchId;
      if (studentId) where.studentId = studentId;
    } else if (auth.user.role === 'ADMIN') {
      if (batchId) where.batchId = batchId;
      if (studentId) where.studentId = studentId;
    } else if (auth.user.role === 'PARENT') {
      if (!studentId) {
        return NextResponse.json(
          { error: { code: 'STUDENT_REQUIRED', message: 'Parent must specify a student ID' } },
          { status: 400 }
        );
      }
      const link = await prisma.parentStudentLink.findUnique({
        where: { parentId_studentId: { parentId: auth.user.id, studentId } },
      });
      if (!link || link.status !== 'APPROVED') {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Not linked to this student' } },
          { status: 403 }
        );
      }
      where.studentId = studentId;
    }

    const scores = await prisma.testScore.findMany({
      where,
      include: {
        student: { select: { id: true, name: true } },
        batch: { select: { id: true, subject: { select: { name: true } } } },
      },
      orderBy: [{ testDate: 'desc' }, { testName: 'asc' }],
    });

    return NextResponse.json({ data: scores });
  } catch (err) {
    console.error('[List Scores] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch scores' } },
      { status: 500 }
    );
  }
}
