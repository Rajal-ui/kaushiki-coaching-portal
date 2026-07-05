import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { updateBatchSchema } from '@/lib/validators/batches';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only admins can update batches' } },
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

  const parsed = updateBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  try {
    const { id } = await params;
    const existing = await prisma.batch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Batch not found' } },
        { status: 404 }
      );
    }

    const batch = await prisma.batch.update({
      where: { id },
      data: parsed.data,
      include: {
        subject: { select: { id: true, name: true } },
        faculty: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(batch);
  } catch (err) {
    console.error('[Update Batch] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update batch' } },
      { status: 500 }
    );
  }
}
