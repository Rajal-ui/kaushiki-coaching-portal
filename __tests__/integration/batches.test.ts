/**
 * @jest-environment node
 */
let mockAuthRole = 'ADMIN';
let mockAuthId = 'admin-id';
jest.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: jest.fn().mockImplementation(() => ({
    user: { id: mockAuthId, role: mockAuthRole, sessionId: 'sess-1' },
  })),
  getTokenFromRequest: jest.fn().mockReturnValue('mock-token'),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    subject: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    batch: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
    enrollment: { findMany: jest.fn() },
  },
}));

const { prisma } = require('@/lib/db/prisma');

describe('Batch Admin CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthRole = 'ADMIN';
  });

  it('allows admin to create a batch', async () => {
    prisma.subject.findUnique.mockResolvedValue({ id: 'subj-1', name: 'Mathematics' });
    prisma.user.findUnique.mockResolvedValue({ id: 'fac-1', name: 'Dr. Sharma', role: 'FACULTY' });
    prisma.batch.create.mockResolvedValue({
      id: 'batch-1',
      subjectId: 'subj-1',
      facultyId: 'fac-1',
      capacity: 30,
      seatsFilled: 0,
      schedule: 'Mon/Wed 4-5 PM',
      status: 'ACTIVE',
    });

    const { POST } = await import('@/app/api/batches/route');
    const req = new Request('http://localhost/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId: 'subj-1', facultyId: 'fac-1', capacity: 30, schedule: 'Mon/Wed 4-5 PM' }),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.id).toBe('batch-1');
  });

  it('rejects batch creation by non-admin', async () => {
    mockAuthRole = 'STUDENT';
    const { POST } = await import('@/app/api/batches/route');
    const req = new Request('http://localhost/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId: 'subj-1', facultyId: 'fac-1', capacity: 30, schedule: 'Mon/Wed 4-5 PM' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('allows admin to list batches', async () => {
    prisma.batch.findMany.mockResolvedValue([{ id: 'batch-1', subjectId: 'subj-1', facultyId: 'fac-1', capacity: 30, seatsFilled: 0, schedule: 'Mon/Wed 4-5 PM', status: 'ACTIVE' }]);
    prisma.batch.count.mockResolvedValue(1);

    const { GET } = await import('@/app/api/batches/route');
    const req = new Request('http://localhost/api/batches?page=1&limit=20');
    const res = await GET(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.pagination.total).toBe(1);
  });

  it('allows admin to update a batch', async () => {
    prisma.batch.findUnique.mockResolvedValue({ id: 'batch-1', subjectId: 'subj-1', facultyId: 'fac-1', capacity: 30, seatsFilled: 0, schedule: 'Mon/Wed 4-5 PM', status: 'ACTIVE' });
    prisma.batch.update.mockResolvedValue({ id: 'batch-1', subjectId: 'subj-1', facultyId: 'fac-1', capacity: 35, seatsFilled: 0, schedule: 'Mon/Wed 4-5 PM', status: 'ACTIVE' });

    const { PATCH } = await import('@/app/api/batches/[id]/route');
    const req = new Request('http://localhost/api/batches/batch-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capacity: 35 }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'batch-1' }) });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.capacity).toBe(35);
  });

  it('rejects batch update by non-admin', async () => {
    mockAuthRole = 'FACULTY';
    const { PATCH } = await import('@/app/api/batches/[id]/route');
    const req = new Request('http://localhost/api/batches/batch-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capacity: 35 }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'batch-1' }) });
    expect(res.status).toBe(403);
  });

  it('rejects invalid faculty in batch creation', async () => {
    prisma.subject.findUnique.mockResolvedValue({ id: 'subj-1', name: 'Mathematics' });
    prisma.user.findUnique.mockResolvedValue({ id: 'student-1', name: 'Alice', role: 'STUDENT' });

    const { POST } = await import('@/app/api/batches/route');
    const req = new Request('http://localhost/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId: 'subj-1', facultyId: 'student-1', capacity: 30, schedule: 'Mon/Wed 4-5 PM' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_FACULTY');
  });
});

describe('Roster access control', () => {
  beforeEach(() => { jest.clearAllMocks(); mockAuthRole = 'FACULTY'; mockAuthId = 'fac-1'; });

  it('allows faculty to view their own batch roster', async () => {
    prisma.batch.findUnique.mockResolvedValue({ id: 'batch-1', subjectId: 'subj-1', facultyId: 'fac-1', capacity: 30, seatsFilled: 0, schedule: 'Mon/Wed 4-5 PM', status: 'ACTIVE', subject: { name: 'Mathematics' }, faculty: { id: 'fac-1' } });
    prisma.enrollment.findMany.mockResolvedValue([
      { student: { id: 's1', name: 'Alice', phone: '9876543210', email: null } },
      { student: { id: 's2', name: 'Bob', phone: '9876543211', email: null } },
    ]);

    const { GET } = await import('@/app/api/batches/[id]/roster/route');
    const req = new Request('http://localhost/api/batches/batch-1/roster');
    const res = await GET(req, { params: Promise.resolve({ id: 'batch-1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.students).toHaveLength(2);
  });

  it('blocks faculty from viewing another faculty roster', async () => {
    prisma.batch.findUnique.mockResolvedValue({ id: 'batch-1', subjectId: 'subj-1', facultyId: 'other-fac', capacity: 30, seatsFilled: 0, schedule: 'Mon/Wed 4-5 PM', status: 'ACTIVE', subject: { name: 'Mathematics' }, faculty: { id: 'other-fac' } });

    const { GET } = await import('@/app/api/batches/[id]/roster/route');
    const req = new Request('http://localhost/api/batches/batch-1/roster');
    const res = await GET(req, { params: Promise.resolve({ id: 'batch-1' }) });
    expect(res.status).toBe(403);
  });
});
