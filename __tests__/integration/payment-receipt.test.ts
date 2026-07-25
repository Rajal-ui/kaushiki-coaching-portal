/**
 * @jest-environment node
 */
import { generateReceiptPdf, type ReceiptData } from '@/lib/pdf/receipt';
import {
  paymentSuccessHtml,
  paymentSuccessText,
  paymentFailedHtml,
  paymentFailedText,
} from '@/lib/email/payment-templates';

describe('PDF Receipt Generation', () => {
  const baseReceipt: ReceiptData = {
    paymentId: 'pay_test123',
    receiptNumber: 'KC-2607-TEST12',
    date: new Date('2026-07-25'),
    studentName: 'Amit Desai',
    studentPhone: '9876543210',
    studentEmail: 'amit@example.com',
    batchName: 'Classes 6-10',
    subjectName: 'Mathematics',
    schedule: 'Mon, Wed, Fri – 4:00 PM to 5:30 PM',
    amount: 1500000,
    currency: 'INR',
    gatewayOrderId: 'order_test456',
  };

  it('generates a valid PDF buffer', async () => {
    const buffer = await generateReceiptPdf(baseReceipt);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('starts with PDF header', async () => {
    const buffer = await generateReceiptPdf(baseReceipt);
    const header = buffer.toString('ascii', 0, 5);
    expect(header).toBe('%PDF-');
  });

  it('contains institution name in metadata', async () => {
    const buffer = await generateReceiptPdf(baseReceipt);
    const content = buffer.toString('latin1');
    expect(content).toContain('Kaushiki Classes');
  });

  it('has valid PDF structure with xref', async () => {
    const buffer = await generateReceiptPdf(baseReceipt);
    const content = buffer.toString('ascii');
    expect(content).toContain('xref');
    expect(content).toContain('%%EOF');
    expect(content).toContain('/Type /Catalog');
  });

  it('works without optional student email', async () => {
    const data = { ...baseReceipt, studentEmail: undefined };
    const buffer = await generateReceiptPdf(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    const header = buffer.toString('ascii', 0, 5);
    expect(header).toBe('%PDF-');
  });
});

describe('Payment Email Templates', () => {
  const receiptData = {
    studentName: 'Amit Desai',
    batchName: 'Classes 6-10',
    subjectName: 'Mathematics',
    schedule: 'Mon, Wed, Fri – 4:00 PM to 5:30 PM',
    amount: 1500000,
    receiptNumber: 'KC-2607-TEST12',
    paymentId: 'pay_test123',
    date: new Date('2026-07-25'),
  };

  describe('paymentSuccessHtml', () => {
    it('contains student name and formatted amount', () => {
      const html = paymentSuccessHtml(receiptData);
      expect(html).toContain('Amit Desai');
      expect(html).toContain('15,000');
    });

    it('contains receipt number', () => {
      const html = paymentSuccessHtml(receiptData);
      expect(html).toContain('KC-2607-TEST12');
    });

    it('contains enrollment active message', () => {
      const html = paymentSuccessHtml(receiptData);
      expect(html).toContain('active');
    });

    it('mentions PDF attachment', () => {
      const html = paymentSuccessHtml(receiptData);
      expect(html).toContain('attached');
    });

    it('contains green success styling', () => {
      const html = paymentSuccessHtml(receiptData);
      expect(html).toContain('#16a34a');
    });
  });

  describe('paymentSuccessText', () => {
    it('contains key details', () => {
      const text = paymentSuccessText(receiptData);
      expect(text).toContain('Amit Desai');
      expect(text).toContain('15,000');
      expect(text).toContain('KC-2607-TEST12');
    });
  });

  describe('paymentFailedHtml', () => {
    const failedData = {
      studentName: 'Amit Desai',
      batchName: 'Classes 6-10',
      amount: 1500000,
    };

    it('contains student name and formatted amount', () => {
      const html = paymentFailedHtml(failedData);
      expect(html).toContain('Amit Desai');
      expect(html).toContain('15,000');
    });

    it('contains failure message', () => {
      const html = paymentFailedHtml(failedData);
      expect(html).toContain('Payment Failed');
      expect(html).toContain('Payment Unsuccessful');
    });

    it('contains support contact', () => {
      const html = paymentFailedHtml(failedData);
      expect(html).toContain('Contact Support');
    });

    it('contains red failure styling', () => {
      const html = paymentFailedHtml(failedData);
      expect(html).toContain('#dc2626');
    });
  });

  describe('paymentFailedText', () => {
    it('contains key details', () => {
      const text = paymentFailedText({
        studentName: 'Amit Desai',
        batchName: 'Classes 6-10',
        amount: 1500000,
      });
      expect(text).toContain('Amit Desai');
      expect(text).toContain('15,000');
      expect(text).toContain('Classes 6-10');
    });
  });
});
