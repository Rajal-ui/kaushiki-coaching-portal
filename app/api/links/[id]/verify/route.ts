import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { verifyPinSchema } from '@/lib/validators/links';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

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

  const parsed = verifyPinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { pin } = parsed.data;

  try {
    const link = await prisma.parentStudentLink.findUnique({ where: { id } });
    if (!link) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Link request not found' } },
        { status: 404 }
      );
    }

    if (auth.user.id !== link.studentId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Only the student can verify the PIN' } },
        { status: 403 }
      );
    }

    if (link.status !== 'PENDING') {
      return NextResponse.json(
        { error: { code: 'ALREADY_PROCESSED', message: `Link already ${link.status.toLowerCase()}` } },
        { status: 400 }
      );
    }

    if (link.pinVerified) {
      return NextResponse.json(
        { error: { code: 'ALREADY_VERIFIED', message: 'PIN has already been verified' } },
        { status: 400 }
      );
    }

    if (link.pin !== pin) {
      return NextResponse.json(
        { error: { code: 'INVALID_PIN', message: 'Invalid PIN provided' } },
        { status: 400 }
      );
    }

    await prisma.parentStudentLink.update({
      where: { id },
      data: { pinVerified: true },
    });

    return NextResponse.json({
      message: 'PIN verified successfully. The link is now ready for admin approval.',
    });
  } catch (err) {
    console.error('[Verify PIN] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to verify PIN' } },
      { status: 500 }
    );
  }
}
