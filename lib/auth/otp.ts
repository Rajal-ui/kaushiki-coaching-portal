import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type { OtpChannel } from '@/types';

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 300;
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 3600;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(identifier: string): boolean {
  return EMAIL_REGEX.test(identifier);
}

export function detectChannel(identifier: string): OtpChannel {
  return isEmail(identifier) ? 'email' : 'sms';
}

export function generateOtp(): string {
  const bytes = crypto.randomBytes(4);
  const num = bytes.readUInt32BE(0) % 1000000;
  return num.toString().padStart(OTP_LENGTH, '0');
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function verifyOtpHash(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

export function buildOtpRedisKey(identifier: string, channel?: OtpChannel): string {
  const ch = channel ?? detectChannel(identifier);
  return `otp:${ch}:${identifier}`;
}

export function buildRateLimitRedisKey(identifier: string, channel?: OtpChannel): string {
  const ch = channel ?? detectChannel(identifier);
  return `otp:ratelimit:${ch}:${identifier}`;
}

export function buildRefreshTokenRedisKey(sessionId: string): string {
  return `refresh:${sessionId}`;
}

export {
  OTP_LENGTH,
  OTP_TTL_SECONDS,
  MAX_ATTEMPTS,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_SECONDS,
};
