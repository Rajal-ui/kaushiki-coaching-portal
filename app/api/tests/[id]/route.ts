import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest, withRole } from '@/lib/auth/middleware';
import { updateTestSchema } from '@/lib/validators/tests';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        batch: { select: { id: true, schedule: true, subject: { select: { name: true } } } },
        faculty: { select: { id: true, name: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Test not found' } },
        { status: 404 }
      );
    }

    // Role checks
    if (auth.user.role === 'STUDENT') {
      // Must be enrolled in batch, and test must be published
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
      // Must be creator or faculty of the batch
      const batch = await prisma.batch.findUnique({ where: { id: test.batchId }, select: { facultyId: true } });
      if (test.facultyId !== auth.user.id && batch?.facultyId !== auth.user.id) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Access denied' } },
          { status: 403 }
        );
      }
    } else if (auth.user.role === 'PARENT') {
      // Check linked student enrolled in batch
      const link = await prisma.parentStudentLink.findFirst({
        where: {
          parentId: auth.user.id,
          status: 'APPROVED',
          student: {
            enrollments: {
              some: { batchId: test.batchId, status: 'ACTIVE' },
            },
          },
        },
      });
      if (!link || test.status !== 'PUBLISHED') {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Access denied' } },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(test);
  } catch (err) {
    console.error('[Get Test] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch test' } },
      { status: 500 }
    );
  }
}

export const PATCH = withRole(['FACULTY', 'ADMIN'], async (
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) => {
  const user = (req as AuthenticatedRequest).user!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = updateTestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  try {
    const { id } = await params;
    const test = await prisma.test.findUnique({ where: { id } });
    if (!test) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Test not found' } },
        { status: 404 }
      );
    }

    if (user.role === 'FACULTY' && test.facultyId !== user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You can only update your own tests' } },
        { status: 403 }
      );
    }

    const updated = await prisma.test.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[Update Test] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update test' } },
      { status: 500 }
    );
  }
});

export const DELETE = withRole(['FACULTY', 'ADMIN'], async (
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) => {
  const user = (req as AuthenticatedRequest).user!;

  try {
    const { id } = await params;
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

    if (user.role === 'FACULTY' && test.facultyId !== user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You can only delete your own tests' } },
        { status: 403 }
      );
    }

    if (test._count.attempts > 0) {
      return NextResponse.json(
        { error: { code: 'PREVENT_DELETE', message: 'Cannot delete test with existing student attempts' } },
        { status: 400 }
      );
    }

    await prisma.test.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Delete Test] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete test' } },
      { status: 500 }
    );
  }
});
