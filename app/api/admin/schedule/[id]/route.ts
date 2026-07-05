import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin only' } }, { status: 403 });
  }

  try {
    const { id } = await params;

    const existing = await prisma.classSession.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Session not found' } }, { status: 404 });
    }

    await prisma.classSession.delete({ where: { id } });

    return NextResponse.json({ data: { id }, message: 'Session deleted' });
  } catch (err) {
    console.error('[Delete Schedule] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete session' } }, { status: 500 });
  }
}
