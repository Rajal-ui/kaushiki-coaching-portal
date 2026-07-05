import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { createOrderSchema } from '@/lib/validators/payments';
import { createRazorpayOrder } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'STUDENT' && auth.user.role !== 'PARENT') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only students and parents can create payment orders' } },
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

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { enrollmentId } = parsed.data;

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { payment: true },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Enrollment not found' } },
        { status: 404 }
      );
    }

    if (enrollment.studentId !== auth.user.id && auth.user.role !== 'PARENT') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not your enrollment' } },
        { status: 403 }
      );
    }

    if (!enrollment.payment) {
      return NextResponse.json(
        { error: { code: 'NO_PAYMENT', message: 'No payment record found for this enrollment' } },
        { status: 400 }
      );
    }

    if (enrollment.payment.status !== 'PENDING') {
      return NextResponse.json(
        { error: { code: 'PAYMENT_NOT_PENDING', message: `Payment is already ${enrollment.payment.status}` } },
        { status: 400 }
      );
    }

    let razorpayOrderId = enrollment.payment.gatewayOrderId;
    if (!razorpayOrderId) {
      const receipt = `enr_${enrollment.studentId.slice(0, 8)}_${Date.now()}`;
      const razorpayOrder = await createRazorpayOrder(enrollment.payment.amount, receipt);
      razorpayOrderId = razorpayOrder.id;

      await prisma.payment.update({
        where: { id: enrollment.payment.id },
        data: { gatewayOrderId: razorpayOrderId },
      });
    }

    return NextResponse.json({
      orderId: razorpayOrderId,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: enrollment.payment.amount,
      currency: enrollment.payment.currency,
    });
  } catch (err) {
    console.error('[Create Order] Error:', err);
    return NextResponse.json(
      { error: { code: 'ORDER_FAILED', message: 'Failed to create payment order' } },
      { status: 500 }
    );
  }
}
