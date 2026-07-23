import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest, withRole } from '@/lib/auth/middleware';
import { createResourceSchema, resourceQuerySchema } from '@/lib/validators/resources';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const parsed = resourceQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { type, trackId, batchId, search, page, limit } = parsed.data;

  try {
    const where: Record<string, unknown> = {};
    if (type) where.type = type;

    const studentId = auth.user.role === 'STUDENT' ? auth.user.id : undefined;

    let batchIds: string[] = [];
    let trackIds: string[] = [];

    if (studentId) {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId, status: 'ACTIVE' },
        select: { batchId: true },
      });
      batchIds = enrollments.map(e => e.batchId);

      const batches = await prisma.batch.findMany({
        where: { id: { in: batchIds } },
        select: { subject: { select: { trackId: true } } },
      });
      trackIds = [...new Set(batches.map(b => b.subject.trackId))];
    } else {
      if (batchId) batchIds = [batchId];
      if (trackId) trackIds = [trackId];
    }

    if (studentId) {
      where.OR = [
        { batches: { some: { batchId: { in: batchIds } } } },
        { tracks: { some: { trackId: { in: trackIds } } } },
      ];
    } else {
      if (batchIds.length > 0) {
        where.batches = { some: { batchId: { in: batchIds } } };
      }
      if (trackIds.length > 0) {
        where.tracks = { some: { trackId: { in: trackIds } } };
      }
    }

    if (search) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        include: {
          uploadedBy: { select: { id: true, name: true } },
          tracks: { include: { track: { select: { id: true, name: true } } } },
          batches: { include: { batch: { select: { id: true, subject: { select: { name: true } } } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.resource.count({ where }),
    ]);

    return NextResponse.json({
      data: resources,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[List Resources] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch resources' } },
      { status: 500 }
    );
  }
}

export const POST = withRole(['FACULTY', 'ADMIN'], async (req: NextRequest) => {
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

  const parsed = createResourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { title, description, fileUrl, type, trackIds, batchIds } = parsed.data;

  try {
    if (trackIds && trackIds.length > 0) {
      const existing = await prisma.track.findMany({ where: { id: { in: trackIds } }, select: { id: true } });
      if (existing.length !== trackIds.length) {
        return NextResponse.json(
          { error: { code: 'INVALID_TRACKS', message: 'One or more tracks not found' } },
          { status: 400 }
        );
      }
    }

    if (batchIds && batchIds.length > 0) {
      const existing = await prisma.batch.findMany({ where: { id: { in: batchIds } }, select: { id: true } });
      if (existing.length !== batchIds.length) {
        return NextResponse.json(
          { error: { code: 'INVALID_BATCHES', message: 'One or more batches not found' } },
          { status: 400 }
        );
      }
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        description,
        fileUrl,
        type,
        uploadedById: user.id,
        tracks: trackIds?.length
          ? { create: trackIds.map(trackId => ({ trackId })) }
          : undefined,
        batches: batchIds?.length
          ? { create: batchIds.map(batchId => ({ batchId })) }
          : undefined,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
        tracks: { include: { track: { select: { id: true, name: true } } } },
        batches: { include: { batch: { select: { id: true, subject: { select: { name: true } } } } } },
      },
    });

    return NextResponse.json({ data: resource }, { status: 201 });
  } catch (err) {
    console.error('[Create Resource] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create resource' } },
      { status: 500 }
    );
  }
});
