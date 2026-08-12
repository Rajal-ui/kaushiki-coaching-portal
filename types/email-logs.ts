export type EmailLogStatus = 'PENDING' | 'SENT' | 'FAILED';

export const EMAIL_TYPES = [
  'PAYMENT_RECEIPT',
  'PAYMENT_FAILED',
  'INQUIRY_CONFIRMATION',
  'ADMIN_ALERT',
  'DOUBT_RESPONSE',
  'SCORECARD',
  'ATTENDANCE_WARNING',
  'OTP',
  'GENERAL',
] as const;

export type EmailType = (typeof EMAIL_TYPES)[number];

export interface EmailAttachmentPayload {
  filename: string;
  contentType?: string;
  content: string; // base64-encoded content
}

export interface EmailPayloadData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachmentPayload[];
}

export interface EmailAuditLog {
  id: string;
  recipientEmail: string;
  subject: string | null;
  template: string | null;
  emailType: EmailType | string | null;
  status: EmailLogStatus;
  errorMessage: string | null;
  retryCount: number;
  sentAt: string | null;
  createdAt: string;
}

export interface EmailLogDetail {
  id: string;
  recipientEmail: string;
  subject: string | null;
  template: string | null;
  emailType: string | null;
  status: EmailLogStatus;
  errorMessage: string | null;
  retryCount: number;
  payloadData: EmailPayloadData | null;
  providerResponse: unknown;
  sentAt: string | null;
  createdAt: string;
}

export interface EmailLogsListResponse {
  data: EmailAuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    PENDING: number;
    SENT: number;
    FAILED: number;
  };
}

export interface EmailLogRetryResponse {
  success: boolean;
  message: string;
}
