/**
 * @jest-environment node
 */
let mockAuthRole = 'STUDENT';
let mockAuthId = 'student-1';
jest.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: jest.fn().mockImplementation(() => ({
    user: { id: mockAuthId, role: mockAuthRole, sessionId: 'sess-1' },
  })),
  getTokenFromRequest: jest.fn().mockReturnValue('mock-token'),
}));

let paymentData: { gatewayOrderId: string | null; status: string; id: string; enrollmentId: string; amount: number } | null = null;
let enrollmentData: { id: string; studentId: string; batchId: string; status: string } | null = null;
let batchData: { id: string; capacity: number; seatsFilled: number; status: string; subjectId: string; facultyId: string } | null = null;

function runTransaction<T>(cb: (tx: typeof mockPrisma) => Promise<T>): Promise<T> {
  return cb(mockPrisma);
}

const mockPrisma = {
  batch: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  enrollment: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  payment: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  processedWebhookEvent: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  parentStudentLink: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  attendance: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  testScore: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn().mockImplementation(runTransaction),
};

jest.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('@/lib/razorpay', () => ({
  createRazorpayOrder: jest.fn().mockResolvedValue({ id: 'order_mock123', entity: 'order', amount: 500000, amount_paid: 0, amount_due: 500000, currency: 'INR', receipt: 'test_receipt', status: 'created', attempts: 0, created_at: Date.now() }),
  refundRazorpayPayment: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/sms/mock', () => ({
  enqueueMockSms: jest.fn().mockResolvedValue(undefined),
}));

const webhookSecret = 'whsec_test_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_key';

function computeSignature(body: string): string {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
}

describe('Enrollment Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    paymentData = null;
    enrollmentData = null;
    batchData = { id: 'batch-1', capacity: 15, seatsFilled: 10, status: 'ACTIVE', subjectId: 'subj-1', facultyId: 'fac-1' };
    linkData = null;

    mockPrisma.batch.findUnique.mockImplementation(() => batchData);
    mockPrisma.enrollment.findUnique.mockImplementation(({ where }: { where: { studentId_batchId?: { studentId: string; batchId: string }; id?: string } }) => {
      if (where.studentId_batchId) return null;
      if (where.id && enrollmentData?.id === where.id) return enrollmentData;
      return null;
    });
    mockPrisma.enrollment.findMany.mockImplementation(() => enrollmentData ? [enrollmentData] : []);
    mockPrisma.enrollment.create.mockImplementation(({ data }: { data: { studentId: string; batchId: string; status: string; enrolledById: string } }) => {
      enrollmentData = { id: 'enr-1', studentId: data.studentId, batchId: data.batchId, status: data.status };
      paymentData = { id: 'pay-1', enrollmentId: 'enr-1', amount: 500000, gatewayOrderId: 'order_mock123', status: 'PENDING' };
      return {
        ...enrollmentData,
        batch: { id: 'batch-1', capacity: 15, schedule: 'Mon/Wed 4-5 PM', subject: { name: 'Mathematics' }, faculty: { name: 'Dr. Sharma' } },
        payment: paymentData,
      };
    });
    mockPrisma.enrollment.update.mockImplementation(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      if (enrollmentData) enrollmentData = { ...enrollmentData, ...data };
      return enrollmentData;
    });
    mockPrisma.batch.update.mockImplementation(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      if (batchData) batchData = { ...batchData, ...data };
      return batchData;
    });
    mockPrisma.payment.findFirst.mockImplementation(({ where }: { where: { gatewayOrderId?: string } }) => {
      if (paymentData && paymentData.gatewayOrderId === where.gatewayOrderId) return paymentData;
      return null;
    });
    mockPrisma.payment.findUnique.mockImplementation(({ where }: { where: { id: string } }) => {
      if (paymentData && paymentData.id === where.id) return paymentData;
      return null;
    });
    mockPrisma.payment.update.mockImplementation(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      if (paymentData) paymentData = { ...paymentData, ...data };
      return paymentData;
    });
    mockPrisma.processedWebhookEvent.findUnique.mockResolvedValue(null);
    mockPrisma.processedWebhookEvent.create.mockResolvedValue({});
  });

  it('creates enrollment and returns razorpay order ID', async () => {
    const { POST } = await import('@/app/api/enrollments/route');
    const req = new Request('http://localhost/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId: 'batch-1' }),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.enrollment).toBeDefined();
    expect(json.enrollment.status).toBe('PENDING');
    expect(json.razorpayOrderId).toBe('order_mock123');
    expect(json.razorpayKeyId).toBeDefined();
    expect(json.payment).toBeDefined();
    expect(json.payment.status).toBe('PENDING');
  });

  it('rejects enrollment when batch is at full capacity', async () => {
    batchData = { id: 'batch-1', capacity: 15, seatsFilled: 15, status: 'ACTIVE', subjectId: 'subj-1', facultyId: 'fac-1' };
    const { POST } = await import('@/app/api/enrollments/route');
    const req = new Request('http://localhost/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId: 'batch-1' }),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(409);
    expect(json.error.code).toBe('BATCH_FULL');
  });

  it('processes webhook payment.captured event', async () => {
    paymentData = { id: 'pay-1', enrollmentId: 'enr-1', amount: 500000, gatewayOrderId: 'order_mock123', status: 'PENDING' };
    enrollmentData = { id: 'enr-1', studentId: 'student-1', batchId: 'batch-1', status: 'PENDING' };

    mockPrisma.payment.findFirst.mockImplementation(() => ({
      ...paymentData,
      enrollment: { ...enrollmentData, batch: { id: 'batch-1', subject: { name: 'Mathematics' } }, student: { id: 'student-1', name: 'Alice', phone: '9876543210' } },
    }));

    mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockPrisma) => Promise<void>) => {
      await cb(mockPrisma);
    });

    const webhookBody = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: { id: 'evt_1', order_id: 'order_mock123', status: 'captured', amount: 500000 },
        },
      },
    });
    const { POST } = await import('@/app/api/payments/webhook/route');
    const req = new Request('http://localhost/api/payments/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': computeSignature(webhookBody) },
      body: webhookBody,
    });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.status).toBe('processed');
  });

  it('ignores duplicate webhook event (idempotency)', async () => {
    mockPrisma.processedWebhookEvent.findUnique.mockResolvedValue({ id: 'evt_1', gateway: 'razorpay', eventType: 'payment.captured', processedAt: new Date() });

    const webhookBody = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: { id: 'evt_1', order_id: 'order_mock123', status: 'captured', amount: 500000 },
        },
      },
    });
    const { POST } = await import('@/app/api/payments/webhook/route');
    const req = new Request('http://localhost/api/payments/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': computeSignature(webhookBody) },
      body: webhookBody,
    });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.status).toBe('ignored');
    expect(json.reason).toBe('duplicate');
  });

  it('rejects webhook with invalid signature', async () => {
    const { POST } = await import('@/app/api/payments/webhook/route');
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'evt_2', order_id: 'order_2', status: 'captured', amount: 500000 } } },
    });
    const req = new Request('http://localhost/api/payments/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': 'invalid_signature' },
      body,
    });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_SIGNATURE');
  });

  it('returns student own enrollments via /me', async () => {
    enrollmentData = { id: 'enr-1', studentId: 'student-1', batchId: 'batch-1', status: 'ACTIVE' };
    const { GET } = await import('@/app/api/enrollments/me/route');
    const req = new Request('http://localhost/api/enrollments/me');
    const res = await GET(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data).toBeDefined();
    expect(json.data.length).toBeGreaterThanOrEqual(1);
  });
});
