import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { createAssignmentSchema, listAssignmentsSchema } from '@/lib/validators/assignments';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'FACULTY' && auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only faculty and admins can create assignments' } },
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

  const parsed = createAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { title, instructions, dueDate, batchIds, resources } = parsed.data;

  try {
    const batches = await prisma.batch.findMany({
      where: { id: { in: batchIds } },
      select: { id: true, facultyId: true },
    });

    if (batches.length !== batchIds.length) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'One or more batches not found' } },
        { status: 404 }
      );
    }

    if (auth.user.role === 'FACULTY') {
      const notMine = batches.filter(b => b.facultyId !== auth.user.id);
      if (notMine.length > 0) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'You can only assign to your own batches' } },
          { status: 403 }
        );
      }
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        instructions,
        dueDate: new Date(dueDate),
        facultyId: auth.user.id,
        resources: resources.length > 0 ? resources : undefined,
        batches: {
          create: batchIds.map(batchId => ({ batchId })),
        },
      },
      include: {
        batches: {
          include: { batch: { select: { id: true, subject: { select: { name: true } } } } },
        },
        faculty: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (err) {
    console.error('[Create Assignment] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create assignment' } },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const query = listAssignmentsSchema.safeParse({
    batchId: url.searchParams.get('batchId') || undefined,
    status: url.searchParams.get('status') || undefined,
  });

  if (!query.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: query.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { batchId } = query.data;

  try {
    const where: Record<string, unknown> = {};

    if (auth.user.role === 'STUDENT') {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: auth.user.id, status: 'ACTIVE' },
        select: { batchId: true },
      });
      const enrolledBatchIds = enrollments.map(e => e.batchId);
      if (enrolledBatchIds.length === 0) return NextResponse.json({ data: [] });
      where.batches = { some: { batchId: { in: enrolledBatchIds } } };
      if (batchId) where.batches = { some: { batchId } };
    } else if (auth.user.role === 'FACULTY') {
      where.facultyId = auth.user.id;
      if (batchId) where.batches = { some: { batchId } };
    } else if (auth.user.role === 'ADMIN') {
      if (batchId) where.batches = { some: { batchId } };
    } else if (auth.user.role === 'PARENT') {
      const links = await prisma.parentStudentLink.findMany({
        where: { parentId: auth.user.id, status: 'APPROVED' },
        select: { studentId: true },
      });
      const linkedIds = links.map(l => l.studentId);
      if (linkedIds.length === 0) return NextResponse.json({ data: [] });
      where.AND = [
        { batches: { some: { batch: { enrollments: { some: { studentId: { in: linkedIds } } } } } } },
      ];
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        batches: {
          include: { batch: { select: { id: true, subject: { select: { name: true } } } } },
        },
        faculty: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: assignments });
  } catch (err) {
    console.error('[List Assignments] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch assignments' } },
      { status: 500 }
    );
  }
}
