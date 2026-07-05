import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { approveLinkSchema } from '@/lib/validators/links';
import { createNotificationForLinkApproved } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only admins can approve link requests' } },
      { status: 403 }
    );
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = approveLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { status } = parsed.data;

  try {
    const link = await prisma.parentStudentLink.findUnique({ where: { id } });
    if (!link) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Link request not found' } },
        { status: 404 }
      );
    }

    if (link.status !== 'PENDING') {
      return NextResponse.json(
        { error: { code: 'ALREADY_PROCESSED', message: `Link already ${link.status.toLowerCase()}` } },
        { status: 400 }
      );
    }

    const updated = await prisma.parentStudentLink.update({
      where: { id },
      data: {
        status,
        approvedById: auth.user.id,
      },
      include: {
        parent: { select: { id: true, name: true, phone: true } },
        student: { select: { id: true, name: true, phone: true } },
      },
    });

    await createNotificationForLinkApproved(id, status);

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[Approve Link] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to process link request' } },
      { status: 500 }
    );
  }
}
