import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin only' } }, { status: 403 });
  }

  const url = new URL(req.url);
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'start and end query params required' } }, { status: 400 });
  }

  try {
    const sessions = await prisma.classSession.findMany({
      where: {
        date: {
          gte: new Date(start),
          lte: new Date(end),
        },
      },
      include: {
        batch: {
          select: {
            id: true,
            schedule: true,
            subject: { select: { id: true, name: true, track: { select: { name: true } } } },
            faculty: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ data: sessions });
  } catch (err) {
    console.error('[List Schedule] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch schedule' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin only' } }, { status: 403 });
  }

  try {
    let body: { batchId: string; date: string; startTime: string; endTime: string; note?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: { code: 'INVALID_JSON', message: 'Invalid request body' } }, { status: 400 });
    }

    if (!body.batchId || !body.date || !body.startTime || !body.endTime) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'batchId, date, startTime, endTime are required' } }, { status: 400 });
    }

    const batch = await prisma.batch.findUnique({ where: { id: body.batchId } });
    if (!batch) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Batch not found' } }, { status: 404 });
    }

    const session = await prisma.classSession.create({
      data: {
        batchId: body.batchId,
        date: new Date(body.date),
        startTime: body.startTime,
        endTime: body.endTime,
        note: body.note || null,
      },
      include: {
        batch: {
          select: {
            id: true,
            subject: { select: { name: true } },
            faculty: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({ data: session }, { status: 201 });
  } catch (err) {
    console.error('[Create Schedule] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create session' } }, { status: 500 });
  }
}
