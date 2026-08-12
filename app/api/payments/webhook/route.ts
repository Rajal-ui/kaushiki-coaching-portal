import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { enqueueMockSms } from '@/lib/sms/mock';
import { createNotificationForPayment } from '@/lib/notifications';
import { sendEmailWithFallback, isEmailConfigured } from '@/lib/email';
import { logEmailDispatch } from '@/lib/email/audit';
import {
  paymentSuccessHtml,
  paymentSuccessText,
  paymentFailedHtml,
  paymentFailedText,
} from '@/lib/email/payment-templates';
import { generateReceiptPdf, type ReceiptData } from '@/lib/pdf/receipt';

const PAYMENT_CAPTURED = 'payment.captured';
const PAYMENT_FAILED = 'payment.failed';

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const { createHmac, timingSafeEqual } = require('crypto');
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

function generateReceiptNumber(paymentId: string): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const shortId = paymentId.slice(-6).toUpperCase();
  return `KC-${year}${month}-${shortId}`;
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

    let paymentEmailData: {
      recipientEmail: string;
      studentName: string;
      batchName: string;
      subjectName: string;
      schedule: string;
      amount: number;
      paymentId: string;
      gatewayOrderId: string;
      phone: string;
    } | null = null;

    let paymentFailedData: {
      recipientEmail: string;
      studentName: string;
      batchName: string;
      amount: number;
    } | null = null;

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
                batch: {
                  include: {
                    subject: { select: { name: true } },
                  },
                },
                student: { select: { id: true, name: true, phone: true, email: true } },
              },
            },
            payer: { select: { id: true, name: true, email: true } },
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

        const seatUpdate = await tx.batch.updateMany({
          where: { id: payment.enrollment.batchId, seatsFilled: { lt: payment.enrollment.batch.capacity } },
          data: { seatsFilled: { increment: 1 } },
        });

        if (seatUpdate.count === 0) {
          console.error(`[Webhook] Batch ${payment.enrollment.batchId} is at capacity, cannot enroll student ${payment.enrollment.studentId}`);
          return;
        }

        await tx.enrollment.update({
          where: { id: payment.enrollmentId },
          data: { status: 'ACTIVE' },
        });

        await enqueueMockSms(
          payment.enrollment.student.phone ?? '',
          `Enrollment confirmed for ${payment.enrollment.batch.subject.name}! Welcome to Kaushiki Classes.`
        );

        await createNotificationForPayment(payment.id, 'SUCCEEDED', paymentEntity.amount);

        const recipientEmail = payment.payer.email || payment.enrollment.student.email;
        if (recipientEmail) {
          paymentEmailData = {
            recipientEmail,
            studentName: payment.enrollment.student.name,
            batchName: payment.enrollment.batch.subject.name,
            subjectName: payment.enrollment.batch.subject.name,
            schedule: payment.enrollment.batch.schedule,
            amount: paymentEntity.amount,
            paymentId: payment.id,
            gatewayOrderId: paymentEntity.order_id,
            phone: payment.enrollment.student.phone ?? '',
          };
        }
      }

      if (event.event === PAYMENT_FAILED) {
        const paymentEntity = event.payload.payment?.entity;
        if (!paymentEntity) return;

        const payment = await tx.payment.findFirst({
          where: { gatewayOrderId: paymentEntity.order_id },
          include: {
            enrollment: {
              include: {
                batch: { include: { subject: { select: { name: true } } } },
                student: { select: { id: true, name: true, phone: true, email: true } },
              },
            },
            payer: { select: { id: true, email: true } },
          },
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
          payment.enrollment.student.phone ?? '',
          'Payment failed. Please try again or contact support.'
        );

        await createNotificationForPayment(payment.id, 'FAILED', paymentEntity.amount);

        const recipientEmail = payment.payer.email || payment.enrollment.student.email;
        if (recipientEmail) {
          paymentFailedData = {
            recipientEmail,
            studentName: payment.enrollment.student.name,
            batchName: payment.enrollment.batch.subject.name,
            amount: paymentEntity.amount,
          };
        }
      }
    });

    if (paymentEmailData && isEmailConfigured()) {
      sendPaymentReceiptEmail(paymentEmailData).catch((err) =>
        console.error('[Webhook] Failed to send payment receipt email:', err)
      );
    }

    if (paymentFailedData && isEmailConfigured()) {
      sendPaymentFailedEmail(paymentFailedData).catch((err) =>
        console.error('[Webhook] Failed to send payment failure email:', err)
      );
    }

    return NextResponse.json({ status: 'processed' });
  } catch (err) {
    console.error('[Webhook] Error:', err);
    return NextResponse.json(
      { error: { code: 'WEBHOOK_ERROR', message: 'Failed to process webhook' } },
      { status: 500 }
    );
  }
}

async function sendPaymentReceiptEmail(data: {
  recipientEmail: string;
  studentName: string;
  batchName: string;
  subjectName: string;
  schedule: string;
  amount: number;
  paymentId: string;
  gatewayOrderId: string;
  phone: string;
}) {
  const receiptNumber = generateReceiptNumber(data.paymentId);

  const receiptData: ReceiptData = {
    paymentId: data.paymentId,
    receiptNumber,
    date: new Date(),
    studentName: data.studentName,
    studentPhone: data.phone,
    batchName: data.batchName,
    subjectName: data.subjectName,
    schedule: data.schedule,
    amount: data.amount,
    currency: 'INR',
    gatewayOrderId: data.gatewayOrderId,
  };

  const pdfBuffer = await generateReceiptPdf(receiptData);

  const emailData = {
    studentName: data.studentName,
    batchName: data.batchName,
    subjectName: data.subjectName,
    schedule: data.schedule,
    amount: data.amount,
    receiptNumber,
    paymentId: data.paymentId,
    date: new Date(),
  };

  const result = await sendEmailWithFallback({
    to: data.recipientEmail,
    subject: `Payment Receipt – ${receiptNumber} | Kaushiki Classes`,
    html: paymentSuccessHtml(emailData),
    text: paymentSuccessText(emailData),
    attachments: [
      {
        filename: `Kaushiki-Receipt-${receiptNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  await logEmailDispatch({
    recipientEmail: data.recipientEmail,
    subject: `Payment Receipt – ${receiptNumber} | Kaushiki Classes`,
    emailType: 'PAYMENT_RECEIPT',
    template: 'payment_receipt',
    status: result.success ? 'SENT' : 'FAILED',
    errorMessage: result.error?.message,
    payloadData: {
      to: data.recipientEmail,
      subject: `Payment Receipt – ${receiptNumber} | Kaushiki Classes`,
      html: paymentSuccessHtml(emailData),
      text: paymentSuccessText(emailData),
      attachments: [
        {
          filename: `Kaushiki-Receipt-${receiptNumber}.pdf`,
          contentType: 'application/pdf',
          content: pdfBuffer.toString('base64'),
        },
      ],
    },
    providerResponse: result.data ?? null,
  });

  if (!result.success) {
    console.error('[Webhook] Payment receipt email failed:', result.error?.message);
  }
}

async function sendPaymentFailedEmail(data: {
  recipientEmail: string;
  studentName: string;
  batchName: string;
  amount: number;
}) {
  const result = await sendEmailWithFallback({
    to: data.recipientEmail,
    subject: `Payment Failed – Kaushiki Classes`,
    html: paymentFailedHtml(data),
    text: paymentFailedText(data),
  });

  await logEmailDispatch({
    recipientEmail: data.recipientEmail,
    subject: `Payment Failed – Kaushiki Classes`,
    emailType: 'PAYMENT_FAILED',
    template: 'payment_failed',
    status: result.success ? 'SENT' : 'FAILED',
    errorMessage: result.error?.message,
    payloadData: {
      to: data.recipientEmail,
      subject: `Payment Failed – Kaushiki Classes`,
      html: paymentFailedHtml(data),
      text: paymentFailedText(data),
    },
    providerResponse: result.data ?? null,
  });

  if (!result.success) {
    console.error('[Webhook] Payment failure email failed:', result.error?.message);
  }
}
