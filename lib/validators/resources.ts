import { z } from 'zod';

export const resourceTypeSchema = z.enum(['NOTES', 'PRACTICE_PAPERS', 'REFERENCE_BOOKS', 'VIDEOS']);

export const createResourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  fileUrl: z.string().min(1, 'File URL is required'),
  type: resourceTypeSchema,
  trackIds: z.array(z.string()).optional(),
  batchIds: z.array(z.string()).optional(),
});

export const updateResourceSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  fileUrl: z.string().min(1).optional(),
  type: resourceTypeSchema.optional(),
  trackIds: z.array(z.string()).optional(),
  batchIds: z.array(z.string()).optional(),
});

export const resourceQuerySchema = z.object({
  type: resourceTypeSchema.optional(),
  trackId: z.string().optional(),
  batchId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type ResourceQueryInput = z.infer<typeof resourceQuerySchema>;
