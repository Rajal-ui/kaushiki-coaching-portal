import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import crypto from 'crypto';

const ACCESS_SECRET = Buffer.from(process.env.JWT_ACCESS_SECRET || 'fallback-access-secret-32-chars-min!!');
const REFRESH_SECRET = Buffer.from(process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-32-chars-min!!');
const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';

export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  name: string;
  role: string;
  sessionId: string;
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;
  sessionId: string;
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export async function signAccessToken(userId: string, role: string, sessionId: string, name?: string): Promise<string> {
  return new SignJWT({ sub: userId, name: name ?? '', role, sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(ACCESS_SECRET);
}

export async function signRefreshToken(userId: string, sessionId: string): Promise<string> {
  return new SignJWT({ sub: userId, sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TTL)
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, ACCESS_SECRET);
  return payload as unknown as AccessTokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, REFRESH_SECRET);
  return payload as unknown as RefreshTokenPayload;
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
