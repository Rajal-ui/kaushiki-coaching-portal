export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
}

export async function createRazorpayOrder(amount: number, receipt: string): Promise<RazorpayOrder> {
  const keyId = process.env.RAZORPAY_KEY_ID!;
  const keySecret = process.env.RAZORPAY_KEY_SECRET!;

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt,
      payment_capture: 1,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Razorpay order creation failed: ${err}`);
  }

  return res.json();
}

export async function captureRazorpayPayment(paymentId: string, amount: number): Promise<void> {
  const keyId = process.env.RAZORPAY_KEY_ID!;
  const keySecret = process.env.RAZORPAY_KEY_SECRET!;

  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
    },
    body: JSON.stringify({ amount, currency: 'INR' }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Razorpay capture failed: ${err}`);
  }
}

export async function refundRazorpayPayment(paymentId: string): Promise<void> {
  const keyId = process.env.RAZORPAY_KEY_ID!;
  const keySecret = process.env.RAZORPAY_KEY_SECRET!;

  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Razorpay refund failed: ${err}`);
  }
}

export function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const crypto = require('crypto');
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
