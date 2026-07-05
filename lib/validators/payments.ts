import { z } from 'zod';

export const createOrderSchema = z.object({
  enrollmentId: z.string(),
});

export const refundPaymentSchema = z.object({
  reason: z.string().optional(),
});
