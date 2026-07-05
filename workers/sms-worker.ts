import Redis from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '../lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { sendTransactionalSms } from '../lib/sms/msg91';

const SMS_QUEUE_KEY = 'sms:queue';
const MAX_RETRIES = 3;
const POLL_INTERVAL_MS = 2000;

async function main() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redis = new Redis(redisUrl, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) return null;
      return Math.min(times * 1000, 5000);
    },
  });

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  console.log('[SMS Worker] Started — polling Redis queue');

  redis.on('error', (err) => {
    console.error('[SMS Worker] Redis error:', err.message);
  });

  const poll = async () => {
    try {
      const raw = await redis.blpop(SMS_QUEUE_KEY, 5);
      if (!raw) {
        setTimeout(poll, POLL_INTERVAL_MS);
        return;
      }

      const job = JSON.parse(raw[1]);
      await processJob(prisma, job);
    } catch (err) {
      console.error('[SMS Worker] Poll error:', err);
    }

    setTimeout(poll, 100);
  };

  poll();
}

interface SmsJob {
  smsLogId: string;
  phone: string;
  templateId: string;
  variables: Record<string, string>;
  triggerEvent: string;
  userId?: string;
}

async function processJob(prisma: PrismaClient, job: SmsJob) {
  const log = await prisma.smsLog.findUnique({ where: { id: job.smsLogId } });
  if (!log) {
    console.warn(`[SMS Worker] Log not found: ${job.smsLogId}`);
    return;
  }

  if (log.status === 'SENT') {
    console.log(`[SMS Worker] Already sent: ${job.smsLogId}`);
    return;
  }

  try {
    const result = await sendTransactionalSms(
      job.phone,
      job.templateId,
      job.variables
    );

    if (result.type === 'skipped') {
      console.warn(`[SMS Worker] Skipped (no config): ${job.smsLogId}`);
      await prisma.smsLog.update({
        where: { id: job.smsLogId },
        data: { status: 'FAILED', failureReason: 'MSG91 not configured' },
      });
      return;
    }

    await prisma.smsLog.update({
      where: { id: job.smsLogId },
      data: {
        status: 'SENT',
        providerId: result.request_id || null,
      },
    });

    console.log(`[SMS Worker] Sent: ${job.smsLogId} to ${job.phone}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const newRetryCount = log.retryCount + 1;

    if (newRetryCount >= MAX_RETRIES) {
      await prisma.smsLog.update({
        where: { id: job.smsLogId },
        data: {
          status: 'FAILED',
          retryCount: newRetryCount,
          failureReason: errorMessage,
        },
      });
      console.error(`[SMS Worker] Failed permanently: ${job.smsLogId} after ${newRetryCount} attempts`);
    } else {
      await prisma.smsLog.update({
        where: { id: job.smsLogId },
        data: {
          retryCount: newRetryCount,
          failureReason: errorMessage,
        },
      });
      console.warn(`[SMS Worker] Retry ${newRetryCount}/${MAX_RETRIES}: ${job.smsLogId}`);

      try {
        const jobRedisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const jobRedis = new Redis(jobRedisUrl, { enableOfflineQueue: false, lazyConnect: true });
        await jobRedis.rpush(SMS_QUEUE_KEY, JSON.stringify(job));
        await jobRedis.quit();
      } catch {
        /* re-enqueue failed */
      }
    }
  }
}

main().catch(console.error);
