import { z } from 'zod';

export const UpdateSettingSchema = z.object({
  value: z.string().min(1, 'Value is required'),
});
