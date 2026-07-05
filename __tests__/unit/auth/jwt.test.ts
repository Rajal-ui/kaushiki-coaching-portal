const mockJoseVerifyFn = jest.fn().mockRejectedValue(new Error('JWT not mocked'));

jest.mock('jose', () => {
  const crypto = require('crypto');
  return {
    SignJWT: class MockSignJWT {
      payload: Record<string, unknown>;
      protectedHeader: Record<string, string> = {};

      constructor(payload: Record<string, unknown>) {
        this.payload = payload;
      }

      setProtectedHeader(header: Record<string, string>) {
        this.protectedHeader = header;
        return this;
      }

      setIssuedAt() { return this; }

      setExpirationTime(_time: string) { return this; }

      async sign(_secret: Uint8Array) {
        const header = Buffer.from(JSON.stringify({ alg: this.protectedHeader.alg || 'HS256', typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify({ ...this.payload, iat: Date.now() / 1000 })).toString('base64url');
        const signature = crypto.createHash('sha256').update(`${header}.${payload}`).digest('base64url');
        return `${header}.${payload}.${signature}`;
      }
    },
    jwtVerify: (token: string) => mockJoseVerifyFn(token),
  };
});

import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, generateSessionId, hashRefreshToken } from '@/lib/auth/jwt';

process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-testing-purposes!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-purposes!!';

describe('JWT Sign / Verify', () => {
  beforeEach(() => {
    mockJoseVerifyFn.mockReset();
  });

  it('signs and verifies access token', async () => {
    const userId = 'user-123';
    const role = 'STUDENT';
    const sessionId = generateSessionId();

    mockJoseVerifyFn.mockResolvedValue({
      payload: { sub: userId, role, sessionId, iat: Date.now() / 1000, exp: Date.now() / 1000 + 900 },
    });

    const token = await signAccessToken(userId, role, sessionId);
    const payload = await verifyAccessToken(token);

    expect(payload.sub).toBe(userId);
    expect(payload.role).toBe(role);
    expect(payload.sessionId).toBe(sessionId);
  });

  it('signs and verifies refresh token', async () => {
    const userId = 'user-456';
    const sessionId = generateSessionId();

    mockJoseVerifyFn.mockResolvedValue({
      payload: { sub: userId, sessionId, iat: Date.now() / 1000, exp: Date.now() / 1000 + 604800 },
    });

    const token = await signRefreshToken(userId, sessionId);
    const payload = await verifyRefreshToken(token);

    expect(payload.sub).toBe(userId);
    expect(payload.sessionId).toBe(sessionId);
  });

  it('rejects expired access token', async () => {
    mockJoseVerifyFn.mockRejectedValue(new Error('JWT Expired'));
    await expect(verifyAccessToken('expired-token')).rejects.toThrow('JWT Expired');
  });

  it('rejects tampered access token', async () => {
    mockJoseVerifyFn.mockRejectedValue(new Error('JWT Invalid'));
    await expect(verifyAccessToken('tampered-token')).rejects.toThrow('JWT Invalid');
  });

  it('rejects access token signed with wrong secret', async () => {
    mockJoseVerifyFn.mockRejectedValue(new Error('JWT Invalid'));
    await expect(verifyAccessToken('wrong-secret-token')).rejects.toThrow('JWT Invalid');
  });

  it('generates unique session IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateSessionId());
    }
    expect(ids.size).toBe(100);
  });
});

describe('hashRefreshToken', () => {
  it('produces a SHA-256 hash', () => {
    const token = 'some-refresh-token-value';
    const hash = hashRefreshToken(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces different hashes for different tokens', () => {
    const hash1 = hashRefreshToken('token-1');
    const hash2 = hashRefreshToken('token-2');
    expect(hash1).not.toBe(hash2);
  });
});
