import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { createTestSchema } from '@/lib/validators/tests';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  if (auth.user.role !== 'FACULTY' && auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only faculty and admins can create tests' } },
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

  const parsed = createTestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  try {
    const { title, description, timeLimit, totalMarks, batchId } = parsed.data;

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Batch not found' } },
        { status: 404 }
      );
    }

    if (auth.user.role === 'FACULTY' && batch.facultyId !== auth.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You can only create tests for your own batches' } },
        { status: 403 }
      );
    }

    const test = await prisma.test.create({
      data: {
        title,
        description,
        timeLimit,
        totalMarks,
        batchId,
        facultyId: auth.user.id,
        status: 'DRAFT',
      },
    });

    return NextResponse.json(test, { status: 201 });
  } catch (err) {
    console.error('[Create Test] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create test' } },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const batchId = url.searchParams.get('batchId') || undefined;

  try {
    const where: Record<string, any> = {};

    if (auth.user.role === 'STUDENT') {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: auth.user.id, status: 'ACTIVE' },
        select: { batchId: true },
      });
      const enrolledBatchIds = enrollments.map(e => e.batchId);

      if (batchId) {
        if (!enrolledBatchIds.includes(batchId)) {
          return NextResponse.json(
            { error: { code: 'FORBIDDEN', message: 'You are not enrolled in this batch' } },
            { status: 403 }
          );
        }
        where.batchId = batchId;
      } else {
        where.batchId = { in: enrolledBatchIds };
      }
      where.status = 'PUBLISHED';
    } else if (auth.user.role === 'FACULTY') {
      if (batchId) {
        where.batchId = batchId;
      }
      const batchesTaught = await prisma.batch.findMany({
        where: { facultyId: auth.user.id },
        select: { id: true },
      });
      const batchIds = batchesTaught.map(b => b.id);
      
      where.OR = [
        { facultyId: auth.user.id },
        { batchId: { in: batchIds } }
      ];
    } else if (auth.user.role === 'ADMIN') {
      if (batchId) {
        where.batchId = batchId;
      }
    } else if (auth.user.role === 'PARENT') {
      const parentLinks = await prisma.parentStudentLink.findMany({
        where: { parentId: auth.user.id, status: 'APPROVED' },
        select: { studentId: true },
      });
      const studentIds = parentLinks.map(l => l.studentId);
      
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: { in: studentIds }, status: 'ACTIVE' },
        select: { batchId: true },
      });
      const batchIds = enrollments.map(e => e.batchId);

      if (batchId) {
        if (!batchIds.includes(batchId)) {
          return NextResponse.json(
            { error: { code: 'FORBIDDEN', message: 'No links to students in this batch' } },
            { status: 403 }
          );
        }
        where.batchId = batchId;
      } else {
        where.batchId = { in: batchIds };
      }
      where.status = 'PUBLISHED';
    }

    const include: Record<string, any> = {
      batch: { select: { id: true, subject: { select: { name: true } } } },
      faculty: { select: { id: true, name: true } },
      _count: { select: { questions: true } },
    };

    if (auth.user.role === 'STUDENT') {
      include.attempts = {
        where: { studentId: auth.user.id },
        select: { id: true, status: true, score: true, startTime: true, endTime: true },
      };
    }

    const tests = await prisma.test.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: tests });
  } catch (err) {
    console.error('[List Tests] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tests' } },
      { status: 500 }
    );
  }
}
