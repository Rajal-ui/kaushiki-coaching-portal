import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/redis';

export interface SmsJob {
  smsLogId: string;
  phone: string;
  templateId: string;
  variables: Record<string, string>;
  triggerEvent: string;
  userId?: string;
}

const SMS_QUEUE_KEY = 'sms:queue';

export async function enqueueSms(job: SmsJob): Promise<void> {
  try {
    await prisma.smsLog.create({
      data: {
        userId: job.userId,
        phone: job.phone,
        templateId: job.templateId,
        triggerEvent: job.triggerEvent,
        status: 'QUEUED',
      },
    });

    try {
      await redis.rpush(SMS_QUEUE_KEY, JSON.stringify(job));
    } catch {
      console.warn('[SMS Queue] Redis unavailable — SMS queued in DB only, worker cannot process');
    }
  } catch (err) {
    console.error('[SMS Queue] Failed to enqueue SMS:', err);
  }
}

export async function enqueueMockSms(phone: string, message: string): Promise<void> {
  console.log(`[Mock SMS] To: ${phone}, Body: ${message}`);

  try {
    await prisma.smsLog.create({
      data: {
        phone,
        templateId: 'mock',
        triggerEvent: 'mock',
        status: 'QUEUED',
      },
    });

    try {
      await redis.rpush(SMS_QUEUE_KEY, JSON.stringify({
        smsLogId: 'mock',
        phone,
        templateId: 'mock',
        variables: { message },
        triggerEvent: 'mock',
      }));
    } catch {
      /* redis unavailable — log only */
    }
  } catch {
    /* db unavailable — skip */
  }
}
