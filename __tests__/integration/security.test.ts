/**
 * @jest-environment node
 */
export {};

export {};

let mockAuthRole: string | null = 'STUDENT';
let mockAuthId: string | null = 'student-1';
let mockAuthUnauthenticated = false;

jest.mock('@/lib/auth/middleware', () => {
  const { NextResponse } = require('next/server');
  const authenticateRequest = jest.fn().mockImplementation(() => {
    if (mockAuthUnauthenticated) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }
    return { user: { id: mockAuthId, role: mockAuthRole, sessionId: 'sess-1' } };
  });
  return {
    authenticateRequest,
    getTokenFromRequest: jest.fn().mockReturnValue('mock-token'),
    withRole: jest.fn().mockImplementation((roles: string | string[], handler: (...args: any[]) => any) => {
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      if (handler.length > 1) {
        return async (req: any, ctx: any) => {
          const result = await authenticateRequest(req);
          if (result instanceof NextResponse) return result;
          req.user = result.user;
          if (allowedRoles.length > 0 && !allowedRoles.includes(result.user.role)) {
            return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }, { status: 403 });
          }
          return handler(req, ctx);
        };
      }
      return async (req: any) => {
        const result = await authenticateRequest(req);
        if (result instanceof NextResponse) return result;
        req.user = result.user;
        if (allowedRoles.length > 0 && !allowedRoles.includes(result.user.role)) {
          return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }, { status: 403 });
        }
        return handler(req);
      };
    }),
  };
});

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    enrollment: { findMany: jest.fn().mockResolvedValue([]) },
    batch: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null) },
    inquiry: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    payment: { findFirst: jest.fn() },
    processedWebhookEvent: { findUnique: jest.fn(), create: jest.fn() },
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    $transaction: jest.fn().mockImplementation((cb: any) => cb(mockPrisma)),
  },
}));

const mockPrisma = {
  processedWebhookEvent: { findUnique: jest.fn(), create: jest.fn() },
  payment: { findFirst: jest.fn(), update: jest.fn() },
  enrollment: { update: jest.fn() },
  batch: { update: jest.fn() },
};

jest.mock('@/lib/redis', () => ({
  redis: { ping: jest.fn().mockResolvedValue('PONG'), get: jest.fn(), set: jest.fn(), del: jest.fn(), incr: jest.fn().mockResolvedValue(1), expire: jest.fn() },
}));

jest.mock('@/lib/sms/mock', () => ({ enqueueMockSms: jest.fn() }));

function mockRequest(method: string, body?: any, headers?: Record<string, string>): any {
  return {
    method,
    headers: new Map(Object.entries(headers || {})),
    json: async () => body,
    text: async () => JSON.stringify(body),
    url: 'http://localhost:3000/api/test',
  };
}

function mockContext(): { params: Promise<Record<string, string>> } {
  return { params: Promise.resolve({}) };
}

describe('Security & Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthRole = 'STUDENT';
    mockAuthId = 'student-1';
    mockAuthUnauthenticated = false;
  });

  describe('Authentication', () => {
    it('rejects unauthenticated requests with 401', async () => {
      mockAuthUnauthenticated = true;
      const { GET } = await import('@/app/api/enrollments/me/route');
      const res = await (GET as any)(mockRequest('GET'));
      expect(res.status).toBe(401);
    });
  });

  describe('Role-based access control', () => {
    it('rejects non-faculty access to faculty-only endpoints', async () => {
      mockAuthRole = 'STUDENT';
      const { GET } = await import('@/app/api/batches/my/route');
      const res = await GET(mockRequest('GET'), mockContext());
      expect(res.status).toBe(403);
    });

    it('rejects non-admin access to admin endpoints', async () => {
      mockAuthRole = 'STUDENT';
      const { POST } = await import('@/app/api/batches/route');
      const req = mockRequest('POST', { subjectId: 'subj-1', facultyId: 'fac-1', capacity: 10, schedule: 'MWF 10AM' });
      const res = await POST(req, mockContext());
      expect(res.status).toBe(403);
    });
  });

  describe('Health endpoint', () => {
    it('returns healthy status with db and redis checks', async () => {
      const { GET } = await import('@/app/api/health/route');
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('healthy');
      expect(body.checks.database).toBe('ok');
      expect(body.checks.redis).toBe('ok');
    });
  });

  describe('Webhook', () => {
    it('rejects webhook with invalid HMAC signature', async () => {
      const { POST } = await import('@/app/api/payments/webhook/route');
      const req = mockRequest('POST', { event: 'payment.captured' }, { 'x-razorpay-signature': 'invalid_sig' });
      const res = await (POST as any)(req);
      expect(res.status).toBe(400);
    });
  });
});

export {};
