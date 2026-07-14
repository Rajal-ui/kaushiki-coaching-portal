import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { gradeSubmissionSchema } from '@/lib/validators/assignments';
import { createNotificationForFeedbackPublished } from '@/lib/notifications';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string; submissionId: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'FACULTY' && auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only faculty can grade submissions' } },
      { status: 403 }
    );
  }

  const { assignmentId, submissionId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = gradeSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { grade, feedback, publish } = parsed.data;

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { facultyId: true },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Assignment not found' } },
        { status: 404 }
      );
    }

    if (auth.user.role === 'FACULTY' && assignment.facultyId !== auth.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not your assignment' } },
        { status: 403 }
      );
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission || submission.assignmentId !== assignmentId) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Submission not found' } },
        { status: 404 }
      );
    }

    const updated = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade,
        feedback: feedback || null,
        feedbackPublished: publish,
        feedbackPublishedAt: publish ? new Date() : null,
      },
      include: { student: { select: { id: true, name: true } } },
    });

    if (publish) {
      await createNotificationForFeedbackPublished(submissionId);
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[Grade Submission] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to grade submission' } },
      { status: 500 }
    );
  }
}
