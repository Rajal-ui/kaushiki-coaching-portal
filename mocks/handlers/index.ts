import { authHandlers } from './auth';
import { batchHandlers } from './batches';
import { inquiryHandlers } from './inquiries';
import { userHandlers } from './users';
import { enrollmentHandlers } from './enrollments';

export const handlers = [
  ...authHandlers,
  ...batchHandlers,
  ...inquiryHandlers,
  ...userHandlers,
  ...enrollmentHandlers,
];
