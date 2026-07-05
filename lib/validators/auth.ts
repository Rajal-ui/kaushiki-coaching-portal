import { z } from 'zod';

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

export const phoneSchema = z.object({
  phone: z
    .string()
    .regex(INDIAN_PHONE_REGEX, 'Invalid Indian mobile number'),
});

export const sendOtpSchema = phoneSchema;

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .regex(INDIAN_PHONE_REGEX, 'Invalid Indian mobile number'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must be numeric'),
});

export const signupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long'),
  phone: z
    .string()
    .regex(INDIAN_PHONE_REGEX, 'Invalid Indian mobile number'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must be numeric'),
  role: z
    .enum(['STUDENT', 'PARENT', 'FACULTY'])
    .optional()
    .default('STUDENT'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or phone is required'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});
