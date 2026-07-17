import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

interface ZoomPayload {
  event: string;
  id?: string;
  eventId?: string;
  meetingId?: string;
  downloadUrl?: string;
  topic?: string;
  payload?: {
    object?: {
      id?: string;
      download_url?: string;
      topic?: string;
      duration?: number;
    };
  };
}

function extractZoomPayload(body: Record<string, unknown>): ZoomPayload {
  return body as unknown as ZoomPayload;
}

export async function POST(req: NextRequest) {
  try {
    const provider = req.headers.get('x-provider') || 'unknown';

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: { code: 'INVALID_JSON', message: 'Invalid body' } }, { status: 400 });
    }

    const zoom = extractZoomPayload(body);
    const eventType = zoom.event || 'unknown';
    const eventId = `${provider}:${eventType}:${zoom.id || zoom.eventId || ''}`;

    const duplicate = await prisma.processedWebhookEvent.findUnique({ where: { id: eventId } });
    if (duplicate) {
      return NextResponse.json({ status: 'duplicate' });
    }

    await prisma.processedWebhookEvent.create({
      data: { id: eventId, gateway: provider, eventType },
    });

    if (eventType === 'meeting.started') {
      const meetingId = zoom.payload?.object?.id || zoom.meetingId;
      if (meetingId) {
        await prisma.liveSession.updateMany({
          where: { meetingId, status: 'SCHEDULED' },
          data: { status: 'LIVE', actualStart: new Date() },
        });
      }
    }

    if (eventType === 'meeting.ended') {
      const meetingId = zoom.payload?.object?.id || zoom.meetingId;
      if (meetingId) {
        await prisma.liveSession.updateMany({
          where: { meetingId, status: 'LIVE' },
          data: { status: 'COMPLETED', actualEnd: new Date() },
        });
      }
    }

    if (eventType === 'recording.completed') {
      const meetingId = zoom.payload?.object?.id || zoom.meetingId;
      const downloadUrl = zoom.payload?.object?.download_url || zoom.downloadUrl;
      const recordingTitle = zoom.payload?.object?.topic || zoom.topic || 'Recording';

      if (meetingId && downloadUrl) {
        const session = await prisma.liveSession.findFirst({
          where: { meetingId },
          select: { id: true, batchId: true, facultyId: true },
        });

        if (session) {
          await prisma.recording.create({
            data: {
              sessionId: session.id,
              batchId: session.batchId,
              facultyId: session.facultyId,
              title: recordingTitle,
              url: downloadUrl,
              platform: provider.toUpperCase() as 'ZOOM' | 'GOOGLE_MEET' | 'MICROSOFT_TEAMS' | 'CUSTOM',
              duration: zoom.payload?.object?.duration || null,
            },
          });
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('[Webhook] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Webhook processing failed' } }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Live sessions webhook endpoint. Use POST with provider events.' });
}
