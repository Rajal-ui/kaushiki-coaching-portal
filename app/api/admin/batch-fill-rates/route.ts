import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/middleware';

export const GET = withRole('ADMIN', async (req) => {
  try {
    const batches = await prisma.batch.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        capacity: true,
        seatsFilled: true,
        subject: { select: { name: true } },
        faculty: { select: { name: true } },
      },
      orderBy: { seatsFilled: 'desc' },
    });

    const data = batches.map((b) => ({
      batchId: b.id,
      subjectName: b.subject.name,
      facultyName: b.faculty.name,
      capacity: b.capacity,
      seatsFilled: b.seatsFilled,
      fillRate: b.capacity > 0 ? Math.round((b.seatsFilled / b.capacity) * 100) / 100 : 0,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[Batch Fill Rates] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch batch fill rates' } }, { status: 500 });
  }
});
