/**
 * @jest-environment node
 */

process.env.SETTINGS_ENCRYPTION_KEY = 'test-settings-encryption-key-32-char';

let mockAuthRole: string = 'ADMIN';
let mockAuthId: string = 'admin-1';

jest.mock('@/lib/auth/middleware', () => {
  const { NextResponse } = require('next/server');
  const authenticateRequest = jest.fn().mockImplementation(() => ({
    user: { id: mockAuthId, role: mockAuthRole, sessionId: 'sess-1' },
  }));
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
            return NextResponse.json(
              { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
              { status: 403 }
            );
          }
          return handler(req, ctx);
        };
      }
      return async (req: any) => {
        const result = await authenticateRequest(req);
        if (result instanceof NextResponse) return result;
        req.user = result.user;
        if (allowedRoles.length > 0 && !allowedRoles.includes(result.user.role)) {
          return NextResponse.json(
            { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
            { status: 403 }
          );
        }
        return handler(req);
      };
    }),
  };
});

interface Row {
  key: string;
  value: string;
  updatedAt: Date;
}

const mockSiteStore = new Map<string, Row>();
const mockConfigStore = new Map<string, Row>();

jest.mock('@/lib/db/prisma', () => {
  const makeModel = (store: Map<string, Row>) => ({
    findMany: jest.fn(async () => [...store.values()]),
    upsert: jest.fn(async ({ where, update, create }: any) => {
      const existing = store.get(where.key);
      const row: Row = existing
        ? { ...existing, ...update, updatedAt: new Date() }
        : { key: create.key, value: create.value, updatedAt: new Date() };
      store.set(row.key, row);
      return row;
    }),
    deleteMany: jest.fn(async ({ where }: any) => {
      const deleted = store.delete(where.key);
      return { count: deleted ? 1 : 0 };
    }),
  });

  return {
    prisma: {
      siteSetting: makeModel(mockSiteStore),
      systemConfig: makeModel(mockConfigStore),
      auditLog: {
        create: jest.fn(async ({ data }: any) => ({ id: 'log-1', ...data })),
      },
    },
  };
});

const { encryptSecret, decryptSecret, isEncryptedSecret } = require('@/lib/settings/crypto');
const { GET, PATCH } = require('@/app/api/admin/settings/route');

function mockRequest(method: string, body?: any): any {
  return {
    method,
    headers: {
      get: (name: string) => {
        if (name === 'x-forwarded-for') return '127.0.0.1';
        if (name === 'user-agent') return 'jest';
        return null;
      },
    },
    json: async () => body,
    url: 'http://localhost:3000/api/admin/settings',
  };
}

describe('Admin Settings API', () => {
  beforeEach(() => {
    mockSiteStore.clear();
    mockConfigStore.clear();
    jest.clearAllMocks();
    mockAuthRole = 'ADMIN';
    mockAuthId = 'admin-1';
  });

  describe('GET /api/admin/settings', () => {
    it('returns settings grouped into sections', async () => {
      mockSiteStore.set('institution_name', {
        key: 'institution_name',
        value: 'Kaushiki Classes',
        updatedAt: new Date('2026-08-01T10:00:00Z'),
      });

      const res = await GET(mockRequest('GET'));
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.data.sections.map((s: any) => s.id)).toEqual([
        'contact',
        'email',
        'sms',
        'payment',
      ]);
      const contact = body.data.sections.find((s: any) => s.id === 'contact');
      expect(contact.fields.find((f: any) => f.key === 'institution_name').value).toBe(
        'Kaushiki Classes'
      );
    });

    it('never returns stored secrets in plaintext', async () => {
      mockConfigStore.set('SMTP_PASS', {
        key: 'SMTP_PASS',
        value: encryptSecret('super-secret-smtp'),
        updatedAt: new Date('2026-08-01T10:00:00Z'),
      });

      const res = await GET(mockRequest('GET'));
      expect(res.status).toBe(200);
      const body = await res.json();

      const email = body.data.sections.find((s: any) => s.id === 'email');
      const smtpPass = email.fields.find((f: any) => f.key === 'SMTP_PASS');
      expect(smtpPass.isSecret).toBe(true);
      expect(smtpPass.isConfigured).toBe(true);
      expect(smtpPass.value).toBe('');
      expect(JSON.stringify(body)).not.toContain('super-secret-smtp');
    });
  });

  describe('PATCH /api/admin/settings', () => {
    it('persists public settings', async () => {
      const res = await PATCH(
        mockRequest('PATCH', { values: { institution_email: 'hello@kaushiki.in' } })
      );
      expect(res.status).toBe(200);
      const body = await res.json();

      const contact = body.data.sections.find((s: any) => s.id === 'contact');
      expect(contact.fields.find((f: any) => f.key === 'institution_email').value).toBe(
        'hello@kaushiki.in'
      );
      expect(mockSiteStore.get('institution_email')?.value).toBe('hello@kaushiki.in');
    });

    it('encrypts secrets at rest', async () => {
      const res = await PATCH(mockRequest('PATCH', { values: { SMTP_PASS: 'smtp-secret-xyz' } }));
      expect(res.status).toBe(200);

      const stored = mockConfigStore.get('SMTP_PASS')?.value;
      expect(stored).toBeDefined();
      expect(stored).not.toContain('smtp-secret-xyz');
      expect(isEncryptedSecret(stored)).toBe(true);
      expect(decryptSecret(stored!)).toBe('smtp-secret-xyz');
    });

    it('keeps existing secret when an empty value is submitted', async () => {
      mockConfigStore.set('SMTP_PASS', {
        key: 'SMTP_PASS',
        value: encryptSecret('original-secret'),
        updatedAt: new Date('2026-08-01T10:00:00Z'),
      });

      const res = await PATCH(
        mockRequest('PATCH', { values: { SMTP_PASS: '', RESEND_API_KEY: '' } })
      );
      expect(res.status).toBe(200);
      expect(decryptSecret(mockConfigStore.get('SMTP_PASS')!.value)).toBe('original-secret');
    });

    it('clears a public value when an empty string is submitted', async () => {
      mockSiteStore.set('institution_website', {
        key: 'institution_website',
        value: 'https://kaushiki.in',
        updatedAt: new Date('2026-08-01T10:00:00Z'),
      });

      const res = await PATCH(mockRequest('PATCH', { values: { institution_website: '' } }));
      expect(res.status).toBe(200);
      expect(mockSiteStore.has('institution_website')).toBe(false);
    });

    it('rejects invalid values with a 400 and details', async () => {
      const res = await PATCH(
        mockRequest('PATCH', { values: { institution_email: 'not-an-email' } })
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details).toHaveProperty('institution_email');
    });

    it('rejects unknown keys', async () => {
      const res = await PATCH(
        mockRequest('PATCH', { values: { totally_unknown_key: 'value' } })
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects malformed bodies', async () => {
      const res = await PATCH(mockRequest('PATCH', { nope: true }));
      expect(res.status).toBe(400);
    });

    it('blocks non-admin roles', async () => {
      mockAuthRole = 'STUDENT';
      const res = await PATCH(mockRequest('PATCH', { values: { institution_name: 'x' } }));
      expect(res.status).toBe(403);
    });

    it('writes an audit log entry for settings updates', async () => {
      await PATCH(
        mockRequest('PATCH', {
          values: { institution_name: 'Kaushiki Classes', SMTP_PASS: 'new-pass' },
        })
      );
      const { prisma } = require('@/lib/db/prisma');
      expect(prisma.auditLog.create).toHaveBeenCalled();
      const call = prisma.auditLog.create.mock.calls[0][0];
      expect(call.data.action).toBe('SETTINGS_UPDATED');
      expect(call.data.userId).toBe('admin-1');
      expect(call.data.details.updatedKeys).toEqual(
        expect.arrayContaining(['institution_name', 'SMTP_PASS'])
      );
      expect(JSON.stringify(call.data)).not.toContain('new-pass');
    });
  });
});
