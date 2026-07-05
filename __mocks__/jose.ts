const crypto = require('crypto');

let verifyImpl: (token: string) => Promise<{ payload: Record<string, unknown> }> = () =>
  Promise.reject(new Error('JWT not mocked'));

export const __setVerifyImpl = (fn: typeof verifyImpl) => {
  verifyImpl = fn;
};

export class SignJWT {
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
}

export async function jwtVerify(token: string) {
  return verifyImpl(token);
}
