import { z } from 'zod';

export const createDoubtSchema = z.object({
  batchId: z.string(),
  questionText: z.string().min(1, 'Question is required').max(2000, 'Question too long'),
  attachmentUrl: z.string().url().optional(),
});

export const respondDoubtSchema = z.object({
  responseText: z.string().min(1, 'Response is required').max(5000, 'Response too long'),
});

export const listDoubtsSchema = z.object({
  batchId: z.string().optional(),
  status: z.enum(['OPEN', 'ANSWERED']).optional(),
});
