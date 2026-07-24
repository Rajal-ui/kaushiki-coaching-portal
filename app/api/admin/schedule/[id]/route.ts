import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/middleware';

export const DELETE = withRole('ADMIN', async (req, { params }) => {
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
});
