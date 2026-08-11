/**
 * @jest-environment node
 */
jest.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: jest.fn(),
  withRole: (_roles: string | string[], handler: any) => {
    return (req: any, ctx: any) => {
      req.user = { id: 'student-1', role: 'STUDENT' };
      return handler(req, ctx);
    };
  },
}));

jest.mock('@/lib/validators/tests', () => ({
  attemptAnswerSchema: { safeParse: (body: any) => ({ success: true, data: body }) },
}));

const mockPrisma: any = {
  test: { findUnique: jest.fn() },
  testAttempt: { findUnique: jest.fn(), update: jest.fn() },
  testAnswer: { findMany: jest.fn(), upsert: jest.fn(), create: jest.fn() },
  testScore: { findFirst: jest.fn(), create: jest.fn() },
  $transaction: jest.fn(async (cb: any) => {
    const tx = {
      testAnswer: {
        upsert: mockPrisma.testAnswer.upsert,
        create: mockPrisma.testAnswer.create,
        findMany: mockPrisma.testAnswer.findMany,
      },
      testAttempt: {
        findUnique: mockPrisma.testAttempt.findUnique,
        update: mockPrisma.testAttempt.update,
      },
      testScore: { findFirst: mockPrisma.testScore.findFirst, create: mockPrisma.testScore.create },
    };
    return cb(tx);
  }),
};

jest.mock('@/lib/db/prisma', () => ({
  get prisma() { return mockPrisma; },
}));

describe('PATCH /api/tests/[id]/attempts/[attemptId] — late submission guard', () => {
  const baseTest = {
    id: 'test-1',
    timeLimit: 10,
    totalMarks: 10,
    batchId: 'batch-1',
    title: 'Quiz 1',
    questions: [
      { id: 'q1', type: 'MCQ', correctOption: 'A', marks: 5, displayOrder: 1 },
    ],
  };

  beforeEach(() => jest.clearAllMocks());

  it('force-submits when manual submit arrives after timer expired', async () => {
    mockPrisma.test.findUnique.mockResolvedValue(baseTest);
    mockPrisma.testAttempt.findUnique.mockResolvedValue({
      id: 'attempt-1',
      studentId: 'student-1',
      status: 'STARTED',
      startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    });
    mockPrisma.testAnswer.findMany.mockResolvedValue([{ questionId: 'q1', selectedOption: 'A' }]);
    mockPrisma.testAnswer.upsert.mockResolvedValue({});
    mockPrisma.testAttempt.update.mockResolvedValue({ id: 'attempt-1', status: 'TIMEOUT', score: 5 });
    mockPrisma.testScore.findFirst.mockResolvedValue(null);
    mockPrisma.testScore.create.mockResolvedValue({});

    const { PATCH } = await import('@/app/api/tests/[id]/attempts/[attemptId]/route');
    const req = { json: async () => ({ action: 'submit', answers: [{ questionId: 'q1', selectedOption: 'A' }] }) };
    const res = await PATCH(req as any, { params: Promise.resolve({ id: 'test-1', attemptId: 'attempt-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('TIMEOUT');
  });

  it('allows save_answers within time limit', async () => {
    mockPrisma.test.findUnique.mockResolvedValue(baseTest);
    mockPrisma.testAttempt.findUnique.mockResolvedValue({
      id: 'attempt-1',
      studentId: 'student-1',
      status: 'STARTED',
      startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    });
    mockPrisma.testAnswer.upsert.mockResolvedValue({});

    const { PATCH } = await import('@/app/api/tests/[id]/attempts/[attemptId]/route');
    const req = { json: async () => ({ action: 'save_answers', answers: [{ questionId: 'q1', selectedOption: 'A' }] }) };
    const res = await PATCH(req as any, { params: Promise.resolve({ id: 'test-1', attemptId: 'attempt-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 404 when attempt not found', async () => {
    mockPrisma.test.findUnique.mockResolvedValue(baseTest);
    mockPrisma.testAttempt.findUnique.mockResolvedValue(null);

    const { PATCH } = await import('@/app/api/tests/[id]/attempts/[attemptId]/route');
    const req = { json: async () => ({ action: 'submit', answers: [] }) };
    const res = await PATCH(req as any, { params: Promise.resolve({ id: 'test-1', attemptId: 'bad-id' }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 when attempt already submitted', async () => {
    mockPrisma.test.findUnique.mockResolvedValue(baseTest);
    mockPrisma.testAttempt.findUnique.mockResolvedValue({
      id: 'attempt-1',
      studentId: 'student-1',
      status: 'COMPLETED',
      startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    });

    const { PATCH } = await import('@/app/api/tests/[id]/attempts/[attemptId]/route');
    const req = { json: async () => ({ action: 'submit', answers: [] }) };
    const res = await PATCH(req as any, { params: Promise.resolve({ id: 'test-1', attemptId: 'attempt-1' }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
  });
});

export {};
