import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-static';
export const revalidate = 60;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subjects = await prisma.subject.findMany({
      where: { trackId: id },
      select: { id: true },
    });
    const subjectIds = subjects.map(s => s.id);

    if (subjectIds.length === 0) {
      return NextResponse.json([]);
    }

    const batches = await prisma.batch.findMany({
      where: {
        subjectId: { in: subjectIds },
        status: 'ACTIVE',
      },
      include: {
        subject: { select: { id: true, name: true } },
        faculty: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(batches);
  } catch (err) {
    console.error('[Track Batches] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch batches' } },
      { status: 500 }
    );
  }
}
