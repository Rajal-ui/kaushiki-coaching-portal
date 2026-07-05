import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only admins can list users' } },
      { status: 403 }
    );
  }

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
}
