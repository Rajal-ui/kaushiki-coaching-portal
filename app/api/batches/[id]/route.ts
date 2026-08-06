import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/middleware';
import { updateBatchSchema } from '@/lib/validators/batches';

export const GET = withRole(['ADMIN', 'FACULTY'], async (req, ctx) => {
  try {
    const { id } = await ctx.params;
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, track: { select: { name: true } } } },
        faculty: { select: { id: true, name: true } },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Batch not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: batch });
  } catch (err) {
    console.error('[Get Batch] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch batch' } },
      { status: 500 }
    );
  }
});


export const PATCH = withRole('ADMIN', async (req, { params }) => {
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
});
