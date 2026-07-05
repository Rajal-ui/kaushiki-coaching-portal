import { z } from 'zod';

export const bulkAttendanceSchema = z.object({
  batchId: z.string(),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  records: z.array(z.object({
    studentId: z.string(),
    present: z.boolean(),
  })).min(1, 'At least one attendance record required'),
});

export const listAttendanceSchema = z.object({
  batchId: z.string().optional(),
  studentId: z.string().optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
