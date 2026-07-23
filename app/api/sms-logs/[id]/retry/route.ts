import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/middleware';
import { redis } from '@/lib/redis';
import { sendTransactionalSms } from '@/lib/sms/msg91';

export const POST = withRole('ADMIN', async (req, { params }) => {
  const { id } = await params;

  try {
    const log = await prisma.smsLog.findUnique({ where: { id } });
    if (!log) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'SMS log not found' } },
        { status: 404 }
      );
    }

    if (log.status !== 'FAILED') {
      return NextResponse.json(
        { error: { code: 'INVALID_STATUS', message: `Cannot retry SMS with status ${log.status}` } },
        { status: 400 }
      );
    }

    await prisma.smsLog.update({
      where: { id },
      data: { status: 'QUEUED', retryCount: 0, failureReason: null },
    });

    try {
      await redis.rpush('sms:queue', JSON.stringify({
        smsLogId: id,
        phone: log.phone,
        templateId: log.templateId,
        variables: {},
        triggerEvent: log.triggerEvent,
      }));
    } catch {
      console.warn('[SMS Retry] Redis unavailable — queued in DB only');
    }

    return NextResponse.json({ success: true, message: 'SMS queued for retry' });
  } catch (err) {
    console.error('[SMS Retry] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retry SMS' } },
      { status: 500 }
    );
  }
});
