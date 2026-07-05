import { z } from 'zod';

export const createLinkSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
});

export const approveLinkSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});
