/**
 * @jest-environment node
 */
let mockAuthRole = 'ADMIN';
jest.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: jest.fn().mockImplementation(() => ({
    user: { id: 'admin-id', role: mockAuthRole, sessionId: 'sess-1' },
  })),
  getTokenFromRequest: jest.fn().mockReturnValue('mock-token'),
}));

jest.mock('@/lib/redis', () => {
  const store = new Map<string, { value: string; expiresAt: number }>();
  const mockRedis = {
    async get(key: string) {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) { store.delete(key); return null; }
      return entry.value;
    },
    async set(key: string, value: string, mode: string, ttl: number) {
      store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
      return 'OK';
    },
    async del(key: string) { store.delete(key); return 1; },
    async incr(key: string) {
      const entry = store.get(key);
      const count = entry ? parseInt(entry.value, 10) : 0;
      const newCount = count + 1;
      store.set(key, { value: String(newCount), expiresAt: entry ? entry.expiresAt : Date.now() + 3600 * 1000 });
      return newCount;
    },
    async expire(key: string, ttl: number) {
      const entry = store.get(key);
      if (entry) entry.expiresAt = Date.now() + ttl * 1000;
      return 1;
    },
    async ttl(key: string) {
      const entry = store.get(key);
      if (!entry) return -2;
      return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
    },
    __clearStore() { store.clear(); },
  };
  return { redis: mockRedis };
});

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    inquiry: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
  },
}));

const { prisma } = require('@/lib/db/prisma');

describe('Inquiry API', () => {
  beforeEach(() => { jest.clearAllMocks(); mockAuthRole = 'ADMIN'; require('@/lib/redis').redis.__clearStore?.(); });

  it('rejects inquiry with honeypot field filled', async () => {
    const { POST } = await import('@/app/api/inquiries/route');
    const req = new Request('http://localhost/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bot', phone: '9876543210', message: 'Spam', honeypot: 'filled' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('BOT_DETECTED');
  });

  it('rejects 6th inquiry from same IP within window', async () => {
    const { POST } = await import('@/app/api/inquiries/route');
    const { redis } = require('@/lib/redis');
    const ipKey = 'inquiry:ratelimit:127.0.0.1';

    for (let i = 0; i < 5; i++) {
      await redis.incr(ipKey);
      if (i === 0) await redis.expire(ipKey, 3600);
    }

    prisma.inquiry.create.mockResolvedValue({ id: '1', name: 'Test', phone: '9876543210', message: 'Hello' });

    const req = new Request('http://localhost/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', phone: '9876543210', message: 'Hello' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('allows inquiry creation with valid data', async () => {
    const { POST } = await import('@/app/api/inquiries/route');
    prisma.inquiry.create.mockResolvedValue({ id: 'inq-1', name: 'John', phone: '9876543210', message: 'I want to enroll', status: 'NEW' });

    const req = new Request('http://localhost/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John', phone: '9876543210', message: 'I want to enroll' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe('inq-1');
  });

  it('allows admin to list inquiries with pagination', async () => {
    prisma.inquiry.findMany.mockResolvedValue([{ id: 'inq-1', name: 'John', phone: '9876543210', message: 'Hello', status: 'NEW', assignee: null, createdAt: new Date().toISOString() }]);
    prisma.inquiry.count.mockResolvedValue(1);

    const { GET } = await import('@/app/api/inquiries/route');
    const req = new Request('http://localhost/api/inquiries?page=1&limit=20');
    const res = await GET(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.pagination.total).toBe(1);
  });

  it('allows admin to update inquiry status', async () => {
    prisma.inquiry.findUnique.mockResolvedValue({ id: 'inq-1' });
    prisma.inquiry.update.mockResolvedValue({ id: 'inq-1', name: 'John', phone: '9876543210', status: 'CONTACTED', assignee: null });

    const { PATCH } = await import('@/app/api/inquiries/[id]/route');
    const req = new Request('http://localhost/api/inquiries/inq-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CONTACTED' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'inq-1' }) });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.status).toBe('CONTACTED');
  });
});
