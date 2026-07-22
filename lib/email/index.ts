import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailResult {
  success: boolean;
  data?: { id: string; provider: 'resend' | 'smtp' };
  error?: Error;
}

export type EmailProvider = 'resend' | 'smtp';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DEFAULT_FROM = 'kaushikiclasses@klnbs.in';

function getFromAddress(): string {
  return process.env.EMAIL_FROM || DEFAULT_FROM;
}

function getProvider(): EmailProvider {
  if (process.env.EMAIL_PROVIDER === 'smtp') return 'smtp';
  return 'resend';
}

// ---------------------------------------------------------------------------
// Resend transport
// ---------------------------------------------------------------------------

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('[Email] RESEND_API_KEY is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

async function sendViaResend(options: SendEmailOptions): Promise<EmailResult> {
  const client = getResendClient();
  const from = getFromAddress();

  const to = Array.isArray(options.to) ? options.to : [options.to];

  const { data, error } = await client.emails.send({
    from,
    to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
    attachments: options.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      content_type: a.contentType,
    })),
  });

  if (error) {
    const err = new Error(error.message || 'Resend API error');
    console.error('[Email] Resend failed:', err.message);
    return { success: false, error: err };
  }

  return { success: true, data: { id: data?.id || '', provider: 'resend' } };
}

// ---------------------------------------------------------------------------
// SMTP transport (nodemailer)
// ---------------------------------------------------------------------------

let smtpTransporter: Transporter | null = null;

function getSmtpTransporter(): Transporter {
  if (!smtpTransporter) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === 'true';

    if (!host) {
      throw new Error('[Email] SMTP_HOST is not set');
    }

    smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
  }
  return smtpTransporter;
}

async function sendViaSmtp(options: SendEmailOptions): Promise<EmailResult> {
  const transporter = getSmtpTransporter();
  const from = getFromAddress();

  const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });

    return { success: true, data: { id: info.messageId, provider: 'smtp' } };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[Email] SMTP failed:', error.message);
    return { success: false, error };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const provider = getProvider();

  try {
    if (provider === 'resend') {
      return await sendViaResend(options);
    }
    return await sendViaSmtp(options);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`[Email] ${provider} provider error:`, error.message);
    return { success: false, error };
  }
}

export async function sendEmailWithFallback(options: SendEmailOptions): Promise<EmailResult> {
  const primary = getProvider();
  const fallback: EmailProvider = primary === 'resend' ? 'smtp' : 'resend';

  const result = await sendEmail(options);
  if (result.success) return result;

  console.warn(`[Email] ${primary} failed, trying ${fallback} fallback`);

  if (fallback === 'resend') {
    return await sendViaResend(options);
  }
  return await sendViaSmtp(options);
}

export function isEmailConfigured(): boolean {
  const provider = getProvider();
  if (provider === 'resend') {
    return !!process.env.RESEND_API_KEY;
  }
  return !!process.env.SMTP_HOST;
}
