/**
 * @jest-environment node
 */
let mockAuthRole = 'FACULTY';
let mockAuthId = 'fac-id';
jest.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: jest.fn().mockImplementation(() => ({
    user: { id: mockAuthId, role: mockAuthRole, sessionId: 'sess-1' },
  })),
  getTokenFromRequest: jest.fn().mockReturnValue('mock-token'),
}));

jest.mock('@/lib/db/prisma', () => {
  const mockPrisma = {
    test: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    batch: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    question: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    enrollment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    parentStudentLink: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    testAttempt: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    testAnswer: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
    },
    testScore: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback(mockPrisma);
    }),
  };
  return { prisma: mockPrisma };
});

const { prisma } = require('@/lib/db/prisma');

describe('Online Quiz API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthRole = 'FACULTY';
    mockAuthId = 'fac-id';
  });

  it('allows faculty to create a test', async () => {
    prisma.batch.findUnique.mockResolvedValue({ id: 'batch-1', facultyId: 'fac-id' });
    prisma.test.create.mockResolvedValue({
      id: 'test-1',
      title: 'Chapter 1 MCQ',
      timeLimit: 30,
      totalMarks: 10,
      batchId: 'batch-1',
      facultyId: 'fac-id',
      status: 'DRAFT',
    });

    const { POST } = await import('@/app/api/tests/route');
    const req = new Request('http://localhost/api/tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Chapter 1 MCQ',
        timeLimit: 30,
        totalMarks: 10,
        batchId: 'batch-1',
      }),
    });

    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.id).toBe('test-1');
  });

  it('allows students to start a test attempt and strips correctOption from active questions', async () => {
    mockAuthRole = 'STUDENT';
    mockAuthId = 'student-1';

    prisma.test.findUnique.mockResolvedValue({
      id: 'test-1',
      title: 'Chapter 1 MCQ',
      timeLimit: 30,
      totalMarks: 10,
      batchId: 'batch-1',
      status: 'PUBLISHED',
      questions: [],
    });
    prisma.enrollment.findFirst.mockResolvedValue({ id: 'enr-1', studentId: 'student-1', batchId: 'batch-1', status: 'ACTIVE' });
    prisma.testAttempt.findFirst.mockResolvedValue(null);
    prisma.testAttempt.create.mockResolvedValue({
      id: 'attempt-1',
      testId: 'test-1',
      studentId: 'student-1',
      startTime: new Date(),
      status: 'STARTED',
      answers: [],
    });

    const { POST: startPOST } = await import('@/app/api/tests/[id]/attempts/route');
    const startReq = new Request('http://localhost/api/tests/test-1/attempts', { method: 'POST' });
    const startRes = await startPOST(startReq, { params: Promise.resolve({ id: 'test-1' }) });
    const startJson = await startRes.json();
    expect(startRes.status).toBe(200);
    expect(startJson.id).toBe('attempt-1');

    prisma.question.findMany.mockResolvedValue([
      { id: 'q-1', type: 'MCQ', questionText: 'What is 2+2?', options: ['3', '4'], correctOption: '1', marks: 5, displayOrder: 1 },
      { id: 'q-2', type: 'MCQ', questionText: 'What is 3+3?', options: ['5', '6'], correctOption: '1', marks: 5, displayOrder: 2 },
    ]);
    prisma.testAttempt.findFirst.mockResolvedValue({
      id: 'attempt-1',
      startTime: new Date(),
      status: 'STARTED',
    });

    const { GET: questionsGET } = await import('@/app/api/tests/[id]/questions/route');
    const qReq = new Request('http://localhost/api/tests/test-1/questions');
    const qRes = await questionsGET(qReq, { params: Promise.resolve({ id: 'test-1' }) });
    const qJson = await qRes.json();
    expect(qRes.status).toBe(200);
    expect(qJson.data[0].correctOption).toBeUndefined();
  });

  it('runs auto-grading for MCQ questions when a student submits', async () => {
    mockAuthRole = 'STUDENT';
    mockAuthId = 'student-1';

    const mockStartTime = new Date();
    prisma.test.findUnique.mockResolvedValue({
      id: 'test-1',
      title: 'Chapter 1 MCQ',
      timeLimit: 30,
      totalMarks: 10,
      batchId: 'batch-1',
      questions: [
        { id: 'q-1', type: 'MCQ', correctOption: '1', marks: 5 },
        { id: 'q-2', type: 'MCQ', correctOption: '0', marks: 5 },
      ],
    });
    prisma.testAttempt.findUnique.mockResolvedValue({
      id: 'attempt-1',
      studentId: 'student-1',
      startTime: mockStartTime,
      status: 'STARTED',
    });

    prisma.testAnswer.findMany.mockResolvedValue([
      { questionId: 'q-1', selectedOption: '1' },
      { questionId: 'q-2', selectedOption: '1' },
    ]);

    prisma.testAttempt.update.mockResolvedValue({
      id: 'attempt-1',
      status: 'COMPLETED',
      score: 5,
    });

    const { PATCH: attemptPATCH } = await import('@/app/api/tests/[id]/attempts/[attemptId]/route');
    const req = new Request('http://localhost/api/tests/test-1/attempts/attempt-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'submit',
        answers: [
          { questionId: 'q-1', selectedOption: '1' },
          { questionId: 'q-2', selectedOption: '1' },
        ],
      }),
    });

    const res = await attemptPATCH(req, { params: Promise.resolve({ id: 'test-1', attemptId: 'attempt-1' }) });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.score).toBe(5);
  });
});
