import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { createEnrollmentSchema, listEnrollmentsSchema } from '@/lib/validators/enrollments';
import { createRazorpayOrder } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'STUDENT' && auth.user.role !== 'PARENT') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only students and parents can enroll' } },
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

  const parsed = createEnrollmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { batchId } = parsed.data;

  try {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        subject: { select: { name: true } },
        faculty: { select: { name: true } },
      },
    });

    if (!batch || batch.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: { code: 'BATCH_NOT_FOUND', message: 'Batch not found or inactive' } },
        { status: 404 }
      );
    }

    if (batch.seatsFilled >= batch.capacity) {
      return NextResponse.json(
        { error: { code: 'BATCH_FULL', message: 'Batch is at full capacity' } },
        { status: 409 }
      );
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { studentId_batchId: { studentId: auth.user.id, batchId } },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: { code: 'ALREADY_ENROLLED', message: 'You are already enrolled in this batch' } },
        { status: 409 }
      );
    }

    const amount = 500000;
    const receipt = `enr_${auth.user.id.slice(0, 8)}_${Date.now()}`;

    const razorpayOrder = await createRazorpayOrder(amount, receipt);

    const enrollment = await prisma.$transaction(async (tx) => {
      const enr = await tx.enrollment.create({
        data: {
          studentId: auth.user.id,
          batchId,
          status: 'PENDING',
          enrolledById: auth.user.id,
          payment: {
            create: {
              payerId: auth.user.id,
              amount,
              currency: 'INR',
              gateway: 'razorpay',
              gatewayOrderId: razorpayOrder.id,
              status: 'PENDING',
            },
          },
        },
        include: {
          batch: {
            select: {
              id: true,
              capacity: true,
              schedule: true,
              subject: { select: { name: true } },
              faculty: { select: { name: true } },
            },
          },
          payment: { select: { id: true, amount: true, currency: true, gatewayOrderId: true, status: true } },
        },
      });

      return enr;
    });

    return NextResponse.json({
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        batch: enrollment.batch,
      },
      payment: enrollment.payment,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount,
    }, { status: 201 });
  } catch (err) {
    console.error('[Create Enrollment] Error:', err);
    return NextResponse.json(
      { error: { code: 'ENROLLMENT_FAILED', message: 'Failed to create enrollment. Please try again.' } },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const query = listEnrollmentsSchema.safeParse({
    studentId: url.searchParams.get('studentId') || undefined,
    status: url.searchParams.get('status') || undefined,
    page: url.searchParams.get('page') || '1',
    limit: url.searchParams.get('limit') || '20',
  });

  if (!query.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: query.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { studentId, status, page, limit } = query.data;

  try {
    const where: Record<string, unknown> = {};

    if (auth.user.role === 'ADMIN') {
      if (studentId) where.studentId = studentId;
    } else if (auth.user.role === 'PARENT') {
      const links = await prisma.parentStudentLink.findMany({
        where: { parentId: auth.user.id, status: 'APPROVED' },
        select: { studentId: true },
      });
      const linkedStudentIds = links.map(l => l.studentId);
      if (studentId && !linkedStudentIds.includes(studentId)) {
        return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not linked to this student' } }, { status: 403 });
      }
      where.studentId = studentId ? { in: [studentId] } : { in: linkedStudentIds };
    } else {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    if (status) where.status = status;

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, phone: true } },
          batch: {
            select: {
              id: true, capacity: true, seatsFilled: true, schedule: true, status: true,
              subject: { select: { id: true, name: true, trackId: true, track: { select: { name: true } } } },
              faculty: { select: { id: true, name: true } },
            },
          },
          payment: { select: { id: true, amount: true, status: true, gatewayOrderId: true } },
        },
        orderBy: { enrolledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.enrollment.count({ where }),
    ]);

    return NextResponse.json({
      data: enrollments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[List Enrollments] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch enrollments' } },
      { status: 500 }
    );
  }
}
