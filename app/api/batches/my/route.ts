import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'FACULTY') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only faculty can view their batches' } },
      { status: 403 }
    );
  }

  try {
    const batches = await prisma.batch.findMany({
      where: { facultyId: auth.user.id },
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
}
