import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/middleware';

export const GET = withRole('ADMIN', async (req) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { status: 'ACTIVE' },
      select: {
        batch: {
          select: {
            subject: {
              select: {
                track: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const trackCount = new Map<string, number>();
    for (const e of enrollments) {
      const name = e.batch.subject.track.name;
      trackCount.set(name, (trackCount.get(name) || 0) + 1);
    }

    const data = Array.from(trackCount.entries()).map(([trackName, count]) => ({ trackName, count }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[Track Distribution] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch track distribution' } }, { status: 500 });
  }
});
