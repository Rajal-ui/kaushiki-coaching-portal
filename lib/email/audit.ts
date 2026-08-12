import { prisma } from '@/lib/db/prisma';
import { sendEmailWithFallback } from '@/lib/email';
import type { Prisma } from '@/lib/generated/prisma/client';
import type { EmailPayloadData, EmailType } from '@/types/email-logs';

export interface EmailAuditLogInput {
  recipientEmail: string;
  subject: string;
  emailType: EmailType;
  template?: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  errorMessage?: string | null;
  payloadData?: EmailPayloadData;
  providerResponse?: { id?: string; provider?: string } | null;
}

export type EmailRetryOutcome =
  | { ok: true; status: 'SENT'; message: string }
  | {
      ok: false;
      code: 'NOT_FOUND' | 'INVALID_STATUS' | 'NO_PAYLOAD' | 'SEND_FAILED';
      message: string;
    };

/**
 * Records an email dispatch into the email_logs audit table.
 * Never throws — failures are logged and swallowed so email delivery
 * is not affected by audit bookkeeping.
 */
export async function logEmailDispatch(input: EmailAuditLogInput): Promise<string | null> {
  try {
    if (!prisma.emailLog?.create) return null;

    const log = await prisma.emailLog.create({
      data: {
        recipientEmail: input.recipientEmail,
        subject: input.subject,
        emailType: input.emailType,
        template: input.template,
        status: input.status,
        errorMessage: input.errorMessage ?? null,
        payloadData: (input.payloadData ?? undefined) as Prisma.InputJsonValue | undefined,
        providerResponse: (input.providerResponse ?? undefined) as Prisma.InputJsonValue | undefined,
        sentAt: input.status === 'SENT' ? new Date() : undefined,
      },
    });
    return log.id;
  } catch (err) {
    console.error('[EmailAudit] Failed to record email dispatch:', err);
    return null;
  }
}

/**
 * Re-dispatches a failed email using the payload stored on the audit log
 * and updates the audit record with the outcome of the attempt.
 */
export async function retryEmailDispatch(logId: string): Promise<EmailRetryOutcome> {
  const log = await prisma.emailLog.findUnique({ where: { id: logId } });

  if (!log) {
    return { ok: false, code: 'NOT_FOUND', message: 'Email log not found' };
  }

  if (log.status !== 'FAILED') {
    return {
      ok: false,
      code: 'INVALID_STATUS',
      message: `Cannot retry email with status ${log.status}`,
    };
  }

  const payload = log.payloadData as EmailPayloadData | null;
  if (!payload || !payload.subject || !payload.html) {
    return {
      ok: false,
      code: 'NO_PAYLOAD',
      message: 'No stored payload available for this log — cannot retry',
    };
  }

  try {
    const result = await sendEmailWithFallback({
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo,
      attachments: payload.attachments?.map((a) => ({
        filename: a.filename,
        contentType: a.contentType,
        content: Buffer.from(a.content, 'base64'),
      })),
    });

    if (result.success) {
      await prisma.emailLog.update({
        where: { id: logId },
        data: {
          status: 'SENT',
          errorMessage: null,
          sentAt: new Date(),
          providerResponse: (result.data ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      });
      return { ok: true, status: 'SENT', message: 'Email sent successfully' };
    }

    const errorMessage = result.error?.message ?? 'Unknown email provider error';
    await prisma.emailLog.update({
      where: { id: logId },
      data: {
        status: 'FAILED',
        errorMessage,
        retryCount: { increment: 1 },
      },
    });
    return {
      ok: false,
      code: 'SEND_FAILED',
      message: `Email send failed: ${errorMessage}`,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown email provider error';
    await prisma.emailLog.update({
      where: { id: logId },
      data: {
        status: 'FAILED',
        errorMessage,
        retryCount: { increment: 1 },
      },
    });
    return {
      ok: false,
      code: 'SEND_FAILED',
      message: `Email send failed: ${errorMessage}`,
    };
  }
}
