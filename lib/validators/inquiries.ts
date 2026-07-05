import { z } from 'zod';

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

export const createInquirySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  phone: z.string().regex(INDIAN_PHONE_REGEX, 'Invalid Indian mobile number'),
  email: z.string().email().optional().or(z.literal('')),
  trackId: z.string().optional().or(z.literal('')),
  message: z.string().min(1, 'Message is required').max(2000),
  honeypot: z.string().optional(),
});

export const updateInquirySchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'ENROLLED', 'CLOSED']).optional(),
  assigneeId: z.string().min(1).optional(),
});

export const inquiryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['NEW', 'CONTACTED', 'ENROLLED', 'CLOSED']).optional(),
  trackId: z.string().optional(),
  assigneeId: z.string().optional(),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type UpdateInquiryInput = z.infer<typeof updateInquirySchema>;
