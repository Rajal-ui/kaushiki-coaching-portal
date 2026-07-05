import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { enqueueMockSms } from '@/lib/sms/mock';

const PAYMENT_CAPTURED = 'payment.captured';
const PAYMENT_FAILED = 'payment.failed';

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const { createHmac, timingSafeEqual } = require('crypto');
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json(
      { error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature mismatch' } },
      { status: 400 }
    );
  }

  let event: { event: string; payload: { payment?: { entity: { id: string; order_id: string; status: string; amount: number; error_description?: string } }; order?: { entity: { id: string; receipt?: string } } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid webhook payload' } },
      { status: 400 }
    );
  }

  const eventId = event.payload?.payment?.entity?.id || event.payload?.order?.entity?.id || '';
  if (!eventId) {
    return NextResponse.json({ error: { code: 'MISSING_EVENT_ID', message: 'No event identifier found' } }, { status: 400 });
  }

  try {
    const existing = await prisma.processedWebhookEvent.findUnique({
      where: { id: eventId },
    });
    if (existing) {
      return NextResponse.json({ status: 'ignored', reason: 'duplicate' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.processedWebhookEvent.create({
        data: { id: eventId, gateway: 'razorpay', eventType: event.event },
      });

      if (event.event === PAYMENT_CAPTURED) {
        const paymentEntity = event.payload.payment?.entity;
        if (!paymentEntity || paymentEntity.status !== 'captured') return;

        const payment = await tx.payment.findFirst({
          where: { gatewayOrderId: paymentEntity.order_id },
          include: {
            enrollment: {
              include: {
                batch: { include: { subject: { select: { name: true } } } },
                student: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        });

        if (!payment || payment.status !== 'PENDING') return;

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCEEDED',
            gatewayEventId: eventId,
          },
        });

        await tx.enrollment.update({
          where: { id: payment.enrollmentId },
          data: { status: 'ACTIVE' },
        });

        await tx.batch.update({
          where: { id: payment.enrollment.batchId },
          data: { seatsFilled: { increment: 1 } },
        });

        await enqueueMockSms(
          payment.enrollment.student.phone,
          `Enrollment confirmed for ${payment.enrollment.batch.subject.name}! Welcome to Kaushiki Classes.`
        );
      }

      if (event.event === PAYMENT_FAILED) {
        const paymentEntity = event.payload.payment?.entity;
        if (!paymentEntity) return;

        const payment = await tx.payment.findFirst({
          where: { gatewayOrderId: paymentEntity.order_id },
          include: { enrollment: { include: { student: true } } },
        });

        if (!payment || payment.status !== 'PENDING') return;

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failureReason: paymentEntity.error_description || 'Payment failed',
            gatewayEventId: eventId,
          },
        });

        await enqueueMockSms(
          payment.enrollment.student.phone,
          'Payment failed. Please try again or contact support.'
        );
      }
    });

    return NextResponse.json({ status: 'processed' });
  } catch (err) {
    console.error('[Webhook] Error:', err);
    return NextResponse.json(
      { error: { code: 'WEBHOOK_ERROR', message: 'Failed to process webhook' } },
      { status: 500 }
    );
  }
}
