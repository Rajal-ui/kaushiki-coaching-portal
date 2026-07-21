import { z } from 'zod/v4';

export const meetingPlatforms = ['ZOOM', 'GOOGLE_MEET', 'MICROSOFT_TEAMS', 'CUSTOM'] as const;

export const createLiveSessionSchema = z.object({
  batchId: z.string().min(1, 'Batch is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  platform: z.enum(meetingPlatforms),
  meetingUrl: z.string().url('Must be a valid URL'),
  meetingId: z.string().optional(),
  passcode: z.string().optional(),
  scheduledStart: z.string().datetime({ message: 'Invalid start datetime' }),
  scheduledEnd: z.string().datetime({ message: 'Invalid end datetime' }),
  isRecurring: z.boolean().optional().default(false),
  recurringPattern: z
    .object({
      frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
      interval: z.number().int().min(1).default(1),
      daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
      endDate: z.string().datetime().optional(),
      occurrences: z.number().int().min(1).max(100).optional(),
    })
    .optional(),
});

export const updateLiveSessionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  platform: z.enum(meetingPlatforms).optional(),
  meetingUrl: z.string().url('Must be a valid URL').optional(),
  meetingId: z.string().optional(),
  passcode: z.string().optional(),
  scheduledStart: z.string().datetime({ message: 'Invalid start datetime' }).optional(),
  scheduledEnd: z.string().datetime({ message: 'Invalid end datetime' }).optional(),
  recordingUrl: z.string().url().optional().nullable(),
  recordingPassword: z.string().optional().nullable(),
  status: z.enum(['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']).optional(),
});

export const createRecordingSchema = z.object({
  sessionId: z.string().optional(),
  batchId: z.string().min(1, 'Batch is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  url: z.string().url('Must be a valid URL'),
  password: z.string().optional(),
  duration: z.number().int().positive().optional(),
  thumbnail: z.string().url().optional(),
  platform: z.enum(meetingPlatforms),
});

export const listLiveSessionsSchema = z.object({
  batchId: z.string().optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateLiveSessionInput = z.infer<typeof createLiveSessionSchema>;
export type UpdateLiveSessionInput = z.infer<typeof updateLiveSessionSchema>;
export type CreateRecordingInput = z.infer<typeof createRecordingSchema>;
export type ListLiveSessionsInput = z.infer<typeof listLiveSessionsSchema>;
