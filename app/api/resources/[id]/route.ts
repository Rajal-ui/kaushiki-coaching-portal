import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest, withRole } from '@/lib/auth/middleware';
import { updateResourceSchema } from '@/lib/validators/resources';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { id: true, name: true } },
        tracks: { include: { track: { select: { id: true, name: true } } } },
        batches: { include: { batch: { select: { id: true, subject: { select: { name: true } } } } } },
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Resource not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: resource });
  } catch (err) {
    console.error('[Get Resource] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch resource' } },
      { status: 500 }
    );
  }
}

export const PATCH = withRole(['FACULTY', 'ADMIN'], async (
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) => {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = updateResourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { trackIds, batchIds, ...fields } = parsed.data;

  try {
    const existing = await prisma.resource.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Resource not found' } },
        { status: 404 }
      );
    }

    const resource = await prisma.$transaction(async (tx) => {
      const updated = await tx.resource.update({
        where: { id },
        data: {
          ...fields,
          ...(trackIds !== undefined
            ? {
                tracks: {
                  deleteMany: {},
                  create: trackIds.map(trackId => ({ trackId })),
                },
              }
            : {}),
          ...(batchIds !== undefined
            ? {
                batches: {
                  deleteMany: {},
                  create: batchIds.map(batchId => ({ batchId })),
                },
              }
            : {}),
        },
        include: {
          uploadedBy: { select: { id: true, name: true } },
          tracks: { include: { track: { select: { id: true, name: true } } } },
          batches: { include: { batch: { select: { id: true, subject: { select: { name: true } } } } } },
        },
      });
      return updated;
    });

    return NextResponse.json({ data: resource });
  } catch (err) {
    console.error('[Update Resource] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update resource' } },
      { status: 500 }
    );
  }
});

export const DELETE = withRole('ADMIN', async (
  _req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) => {
  const { id } = await params;

  try {
    const existing = await prisma.resource.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Resource not found' } },
        { status: 404 }
      );
    }

    await prisma.resource.delete({ where: { id } });

    return NextResponse.json({ data: { id } }, { status: 200 });
  } catch (err) {
    console.error('[Delete Resource] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete resource' } },
      { status: 500 }
    );
  }
});
