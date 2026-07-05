import { z } from 'zod';

export const createScoresSchema = z.object({
  batchId: z.string(),
  testName: z.string().min(1, 'Test name is required'),
  testDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  maxScore: z.number().int().positive(),
  scores: z.array(z.object({
    studentId: z.string(),
    score: z.number().int().min(0),
    remark: z.string().optional(),
  })).min(1, 'At least one score entry required'),
});

export const listScoresSchema = z.object({
  batchId: z.string().optional(),
  studentId: z.string().optional(),
});
