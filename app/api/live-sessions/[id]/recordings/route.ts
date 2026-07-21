import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { createRecordingSchema } from '@/lib/validators/live-sessions';
import { createNotificationForRecordingPublished } from '@/lib/notifications';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const session = await prisma.liveSession.findUnique({ where: { id }, select: { id: true } });
    if (!session) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Live session not found' } },
        { status: 404 }
      );
    }

    const recordings = await prisma.recording.findMany({
      where: { sessionId: id },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ data: recordings });
  } catch (err) {
    console.error('[List Session Recordings] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch recordings' } },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = createRecordingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  try {
    const { id } = await params;

    const session = await prisma.liveSession.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Live session not found' } },
        { status: 404 }
      );
    }

    if (session.facultyId !== auth.user.id && auth.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Only the faculty can add recordings' } },
        { status: 403 }
      );
    }

    const recording = await prisma.recording.create({
      data: {
        sessionId: id,
        batchId: session.batchId,
        facultyId: auth.user.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        url: parsed.data.url,
        password: parsed.data.password || null,
        duration: parsed.data.duration || null,
        thumbnail: parsed.data.thumbnail || null,
        platform: parsed.data.platform,
      },
    });

    await createNotificationForRecordingPublished(recording.id);

    return NextResponse.json({ data: recording }, { status: 201 });
  } catch (err) {
    console.error('[Create Recording] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create recording' } },
      { status: 500 }
    );
  }
}
