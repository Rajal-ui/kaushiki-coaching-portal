import { authHandlers } from './auth';
import { batchHandlers } from './batches';
import { inquiryHandlers } from './inquiries';
import { userHandlers } from './users';

export const handlers = [
  ...authHandlers,
  ...batchHandlers,
  ...inquiryHandlers,
  ...userHandlers,
];
