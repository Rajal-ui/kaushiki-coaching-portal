import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { respondDoubtSchema } from '@/lib/validators/doubts';
import { enqueueSms } from '@/lib/sms/queue';
import { createNotificationForDoubtAnswered } from '@/lib/notifications';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'FACULTY' && auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only faculty and admins can respond to doubts' } },
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

  const parsed = respondDoubtSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { responseText } = parsed.data;

  try {
    const doubt = await prisma.doubtQuery.findUnique({
      where: { id },
      include: {
        batch: { select: { facultyId: true } },
        student: { select: { id: true, phone: true, name: true } },
      },
    });

    if (!doubt) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Doubt not found' } },
        { status: 404 }
      );
    }

    if (auth.user.role === 'FACULTY' && doubt.batch.facultyId !== auth.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not your batch' } },
        { status: 403 }
      );
    }

    if (doubt.status === 'ANSWERED') {
      return NextResponse.json(
        { error: { code: 'ALREADY_ANSWERED', message: 'This doubt has already been answered' } },
        { status: 400 }
      );
    }

    const updated = await prisma.doubtQuery.update({
      where: { id },
      data: {
        responseText,
        respondedById: auth.user.id,
        respondedAt: new Date(),
        status: 'ANSWERED',
      },
      include: {
        student: { select: { id: true, name: true, phone: true } },
        batch: { select: { id: true, subject: { select: { name: true } } } },
        respondedBy: { select: { id: true, name: true } },
      },
    });

    if (doubt.student.phone) {
      await enqueueSms({
        smsLogId: `doubt_${id}`,
        phone: doubt.student.phone,
        templateId: process.env.MSG91_TEMPLATE_DOUBT_ANSWERED || 'doubt_answered',
        variables: { faculty_name: updated.respondedBy?.name || 'Faculty' },
        triggerEvent: 'doubt_answered',
        userId: doubt.student.id,
      });
    }

    await createNotificationForDoubtAnswered(id);

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[Respond Doubt] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to respond to doubt' } },
      { status: 500 }
    );
  }
}
