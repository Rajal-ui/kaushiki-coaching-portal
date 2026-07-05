import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { refundRazorpayPayment } from '@/lib/razorpay';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only admins can process refunds' } },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { enrollment: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Payment not found' } },
        { status: 404 }
      );
    }

    if (payment.status !== 'SUCCEEDED') {
      return NextResponse.json(
        { error: { code: 'INVALID_STATUS', message: `Cannot refund payment with status ${payment.status}` } },
        { status: 400 }
      );
    }

    await refundRazorpayPayment(payment.gatewayOrderId!);

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' },
      });

      await tx.enrollment.update({
        where: { id: payment.enrollmentId },
        data: { status: 'REVOKED' },
      });

      await tx.batch.update({
        where: { id: payment.enrollment.batchId },
        data: { seatsFilled: { decrement: 1 } },
      });
    });

    return NextResponse.json({ success: true, message: 'Payment refunded successfully' });
  } catch (err) {
    console.error('[Refund] Error:', err);
    return NextResponse.json(
      { error: { code: 'REFUND_FAILED', message: 'Failed to process refund' } },
      { status: 500 }
    );
  }
}
