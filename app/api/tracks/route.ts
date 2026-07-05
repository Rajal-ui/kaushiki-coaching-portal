import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-static';

export async function GET() {
  try {
    const tracks = await prisma.track.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        subjects: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(tracks);
  } catch (err) {
    console.error('[Tracks] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tracks' } },
      { status: 500 }
    );
  }
}
