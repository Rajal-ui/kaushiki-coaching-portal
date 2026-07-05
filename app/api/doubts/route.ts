import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { createDoubtSchema, listDoubtsSchema } from '@/lib/validators/doubts';
import { enqueueSms } from '@/lib/sms/queue';
import { createNotificationForDoubtSubmitted } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'STUDENT') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only students can submit doubts' } },
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

  const parsed = createDoubtSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { batchId, questionText, attachmentUrl } = parsed.data;

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_batchId: { studentId: auth.user.id, batchId } },
    });

    if (!enrollment || enrollment.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: { code: 'NOT_ENROLLED', message: 'You must be enrolled in this batch to ask doubts' } },
        { status: 403 }
      );
    }

    const doubt = await prisma.doubtQuery.create({
      data: {
        studentId: auth.user.id,
        batchId,
        questionText,
        attachmentUrl: attachmentUrl || null,
        status: 'OPEN',
      },
      include: {
        batch: { select: { id: true, subject: { select: { name: true } }, faculty: { select: { id: true, name: true, phone: true } } } },
      },
    });

    await enqueueSms({
      smsLogId: doubt.id,
      phone: doubt.batch.faculty.phone,
      templateId: process.env.MSG91_TEMPLATE_DOUBT_ANSWERED || 'doubt_received',
      variables: { student_name: auth.user.id },
      triggerEvent: 'doubt_submitted',
    });

    await createNotificationForDoubtSubmitted(doubt.id);

    return NextResponse.json(doubt, { status: 201 });
  } catch (err) {
    console.error('[Create Doubt] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to submit doubt question' } },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const query = listDoubtsSchema.safeParse({
    batchId: url.searchParams.get('batchId') || undefined,
    status: url.searchParams.get('status') || undefined,
  });

  if (!query.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: query.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { batchId, status } = query.data;

  try {
    const where: Record<string, unknown> = {};

    if (auth.user.role === 'STUDENT') {
      where.studentId = auth.user.id;
    } else if (auth.user.role === 'FACULTY') {
      const batches = await prisma.batch.findMany({
        where: { facultyId: auth.user.id },
        select: { id: true },
      });
      where.batchId = { in: batches.map(b => b.id) };
      if (batchId && !batches.some(b => b.id === batchId)) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Not your batch' } },
          { status: 403 }
        );
      }
    } else if (auth.user.role === 'PARENT') {
      const links = await prisma.parentStudentLink.findMany({
        where: { parentId: auth.user.id, status: 'APPROVED' },
        select: { studentId: true },
      });
      const linkedIds = links.map(l => l.studentId);
      if (linkedIds.length === 0) {
        return NextResponse.json({ data: [] });
      }
      where.studentId = { in: linkedIds };
    } else if (auth.user.role === 'ADMIN') {
      if (batchId) where.batchId = batchId;
    }

    if (status) where.status = status;
    if (batchId && !where.batchId) where.batchId = batchId;

    const doubts = await prisma.doubtQuery.findMany({
      where,
      include: {
        student: { select: { id: true, name: true } },
        batch: { select: { id: true, subject: { select: { name: true } } } },
        respondedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: doubts });
  } catch (err) {
    console.error('[List Doubts] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch doubts' } },
      { status: 500 }
    );
  }
}
