import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/middleware';

export const GET = withRole('ADMIN', async (req, { params }) => {
  const { id } = await params;

  try {
    const log = await prisma.emailLog.findUnique({ where: { id } });
    if (!log) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Email log not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: log });
  } catch (err) {
    console.error('[Get Email Log] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch email log' } },
      { status: 500 }
    );
  }
});
