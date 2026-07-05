import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { createLinkSchema } from '@/lib/validators/links';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'PARENT' && auth.user.role !== 'STUDENT') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only parents and students can create link requests' } },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = createLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { phone } = parsed.data;

  try {
    const otherUser = await prisma.user.findUnique({ where: { phone } });
    if (!otherUser) {
      return NextResponse.json(
        { error: { code: 'USER_NOT_FOUND', message: 'No user found with this phone number' } },
        { status: 404 }
      );
    }

    const [parentId, studentId] = auth.user.role === 'PARENT'
      ? [auth.user.id, otherUser.id]
      : [otherUser.id, auth.user.id];

    if (otherUser.role === auth.user.role) {
      return NextResponse.json(
        { error: { code: 'INVALID_ROLE', message: `Cannot link two ${auth.user.role.toLowerCase()} accounts` } },
        { status: 400 }
      );
    }

    const existing = await prisma.parentStudentLink.findUnique({
      where: { parentId_studentId: { parentId, studentId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: { code: 'LINK_EXISTS', message: `Link already exists with status: ${existing.status}` } },
        { status: 409 }
      );
    }

    const link = await prisma.parentStudentLink.create({
      data: { parentId, studentId },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (err) {
    console.error('[Create Link] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create link request' } },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  try {
    const links = await prisma.parentStudentLink.findMany({
      where: {
        OR: [
          { parentId: auth.user.id },
          { studentId: auth.user.id },
        ],
      },
      include: {
        parent: { select: { id: true, name: true, phone: true } },
        student: { select: { id: true, name: true, phone: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: links });
  } catch (err) {
    console.error('[List Links] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch links' } },
      { status: 500 }
    );
  }
}
