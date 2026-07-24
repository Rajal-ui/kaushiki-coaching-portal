import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/middleware';
import { createBatchSchema } from '@/lib/validators/batches';

export const GET = withRole(['ADMIN'], async (req) => {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
  const status = url.searchParams.get('status');

  try {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        include: {
          subject: { select: { id: true, name: true, trackId: true, track: { select: { name: true } } } },
          faculty: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.batch.count({ where }),
    ]);

    return NextResponse.json({
      data: batches,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[List Batches] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch batches' } },
      { status: 500 }
    );
  }
});

export const POST = withRole(['ADMIN'], async (req) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = createBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  try {
    const { subjectId, facultyId, capacity, schedule } = parsed.data;

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Subject not found' } },
        { status: 404 }
      );
    }

    const faculty = await prisma.user.findUnique({ where: { id: facultyId } });
    if (!faculty || faculty.role !== 'FACULTY') {
      return NextResponse.json(
        { error: { code: 'INVALID_FACULTY', message: 'Invalid faculty member' } },
        { status: 400 }
      );
    }

    const batch = await prisma.batch.create({
      data: { subjectId, facultyId, capacity, schedule },
      include: {
        subject: { select: { id: true, name: true, trackId: true, track: { select: { name: true } } } },
        faculty: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (err) {
    console.error('[Create Batch] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create batch' } },
      { status: 500 }
    );
  }
});
