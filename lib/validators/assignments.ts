import { z } from 'zod';

export const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  instructions: z.string().min(1, 'Instructions are required'),
  dueDate: z.string().datetime({ message: 'Invalid due date' }),
  batchIds: z.array(z.string()).min(1, 'At least one batch is required'),
  resources: z
    .array(z.object({ name: z.string(), url: z.string() }))
    .optional()
    .default([]),
});

export const listAssignmentsSchema = z.object({
  batchId: z.string().optional(),
  status: z.enum(['UPCOMING', 'DUE', 'OVERDUE']).optional(),
});

export const submitAssignmentSchema = z.object({
  submissionText: z.string().optional(),
  fileUrls: z
    .array(z.object({ name: z.string(), url: z.string() }))
    .optional()
    .default([]),
});

export const gradeSubmissionSchema = z.object({
  grade: z.number().int().min(0, 'Grade must be non-negative'),
  feedback: z.string().max(10000, 'Feedback too long').optional(),
  publish: z.boolean().default(false),
});
