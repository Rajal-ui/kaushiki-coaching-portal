import { z } from 'zod';

export const createBatchSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  facultyId: z.string().min(1, 'Faculty is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  schedule: z.string().min(1, 'Schedule is required'),
});

export const updateBatchSchema = z.object({
  subjectId: z.string().min(1).optional(),
  facultyId: z.string().min(1).optional(),
  capacity: z.number().int().min(1).optional(),
  schedule: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  seatsFilled: z.number().int().min(0).optional(),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;
