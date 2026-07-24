import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/middleware';
import { updateInquirySchema } from '@/lib/validators/inquiries';

export const PATCH = withRole('ADMIN', async (req, { params }) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = updateInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  try {
    const { id } = await params;
    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Inquiry not found' } },
        { status: 404 }
      );
    }

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: parsed.data,
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(inquiry);
  } catch (err) {
    console.error('[Update Inquiry] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update inquiry' } },
      { status: 500 }
    );
  }
});
