import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/middleware';

export const GET = withRole('ADMIN', async (req) => {
  const url = new URL(req.url);
  const role = url.searchParams.get('role');

  try {
    const where: Record<string, unknown> = {};
    if (role) where.role = role;

    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, phone: true, role: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error('[List Users] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch users' } },
      { status: 500 }
    );
  }
});
