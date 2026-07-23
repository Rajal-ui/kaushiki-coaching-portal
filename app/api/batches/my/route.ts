import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole, type AuthenticatedRequest } from '@/lib/auth/middleware';

export const GET = withRole(['FACULTY'], async (req) => {
  const { user } = req as AuthenticatedRequest;
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  try {
    const batches = await prisma.batch.findMany({
      where: { facultyId: user.id },
      include: {
        subject: {
          select: { id: true, name: true, track: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(batches);
  } catch (err) {
    console.error('[My Batches] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch batches' } },
      { status: 500 }
    );
  }
});
