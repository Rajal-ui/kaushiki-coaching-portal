import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const recording = await prisma.recording.findUnique({ where: { id } });
    if (!recording) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Recording not found' } },
        { status: 404 }
      );
    }

    if (recording.facultyId !== auth.user.id && auth.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not authorized to delete this recording' } },
        { status: 403 }
      );
    }

    await prisma.recording.delete({ where: { id } });

    return NextResponse.json({ data: { id }, message: 'Recording deleted' });
  } catch (err) {
    console.error('[Delete Recording] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete recording' } },
      { status: 500 }
    );
  }
}
