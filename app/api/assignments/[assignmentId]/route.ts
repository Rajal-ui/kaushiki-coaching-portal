import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

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
      include: {
        batches: {
          include: { batch: { select: { id: true, subject: { select: { name: true } } } } },
        },
        faculty: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
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
          { error: { code: 'FORBIDDEN', message: 'Not enrolled in this assignment' } },
          { status: 403 }
        );
      }
    } else if (auth.user.role === 'FACULTY' && assignment.facultyId !== auth.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not your assignment' } },
        { status: 403 }
      );
    }

    const submission = auth.user.role === 'STUDENT'
      ? await prisma.assignmentSubmission.findUnique({
          where: { assignmentId_studentId: { assignmentId, studentId: auth.user.id } },
        })
      : null;

    return NextResponse.json({ ...assignment, mySubmission: submission || null });
  } catch (err) {
    console.error('[Get Assignment] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch assignment' } },
      { status: 500 }
    );
  }
}
