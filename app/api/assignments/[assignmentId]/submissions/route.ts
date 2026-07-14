import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { submitAssignmentSchema } from '@/lib/validators/assignments';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'STUDENT') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only students can submit assignments' } },
      { status: 403 }
    );
  }

  const { assignmentId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = submitAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { submissionText, fileUrls } = parsed.data;

  if (!submissionText && (!fileUrls || fileUrls.length === 0)) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Submit text or at least one file' } },
      { status: 400 }
    );
  }

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { batches: { select: { batchId: true } } },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Assignment not found' } },
        { status: 404 }
      );
    }

    const enrolled = await prisma.enrollment.findFirst({
      where: {
        studentId: auth.user.id,
        status: 'ACTIVE',
        batchId: { in: assignment.batches.map(b => b.batchId) },
      },
    });

    if (!enrolled) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not enrolled in this assignment' } },
        { status: 403 }
      );
    }

    const existing = await prisma.assignmentSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId: auth.user.id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Already submitted. Contact faculty to resubmit.' } },
        { status: 409 }
      );
    }

    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId: auth.user.id,
        submissionText: submissionText || null,
        fileUrls: fileUrls && fileUrls.length > 0 ? fileUrls : undefined,
      },
      include: {
        assignment: { select: { title: true, dueDate: true } },
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (err) {
    console.error('[Submit Assignment] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to submit assignment' } },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  const { assignmentId } = await params;

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { batches: { select: { batchId: true } } },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Assignment not found' } },
        { status: 404 }
      );
    }

    if (auth.user.role === 'STUDENT') {
      const enrolled = await prisma.enrollment.findFirst({
        where: {
          studentId: auth.user.id,
          status: 'ACTIVE',
          batchId: { in: assignment.batches.map(b => b.batchId) },
        },
      });
      if (!enrolled) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Not enrolled' } },
          { status: 403 }
        );
      }

      const submissions = await prisma.assignmentSubmission.findMany({
        where: { assignmentId, studentId: auth.user.id },
        include: { student: { select: { id: true, name: true } } },
        orderBy: { submittedAt: 'desc' },
      });

      return NextResponse.json({ data: submissions });
    }

    const where: Record<string, unknown> = { assignmentId };

    if (auth.user.role === 'FACULTY') {
      if (assignment.facultyId !== auth.user.id) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Not your assignment' } },
          { status: 403 }
        );
      }
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json({ data: submissions });
  } catch (err) {
    console.error('[List Submissions] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch submissions' } },
      { status: 500 }
    );
  }
}
