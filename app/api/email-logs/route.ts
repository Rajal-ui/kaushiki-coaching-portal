import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/middleware';
import type { Prisma } from '@/lib/generated/prisma/client';

export const GET = withRole('ADMIN', async (req) => {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
  const status = url.searchParams.get('status');
  const emailType = url.searchParams.get('emailType');
  const search = url.searchParams.get('search');

  try {
    const where: Prisma.EmailLogWhereInput = {};
    if (status === 'SENT' || status === 'FAILED' || status === 'PENDING') {
      where.status = status;
    }
    if (emailType) {
      where.emailType = emailType;
    }
    if (search) {
      where.OR = [
        { recipientEmail: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [logs, total, sent, failed, pending] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          recipientEmail: true,
          subject: true,
          template: true,
          emailType: true,
          status: true,
          errorMessage: true,
          retryCount: true,
          sentAt: true,
          createdAt: true,
        },
      }),
      prisma.emailLog.count({ where }),
      prisma.emailLog.count({ where: { status: 'SENT' } }),
      prisma.emailLog.count({ where: { status: 'FAILED' } }),
      prisma.emailLog.count({ where: { status: 'PENDING' } }),
    ]);

    return NextResponse.json({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: { SENT: sent, FAILED: failed, PENDING: pending },
    });
  } catch (err) {
    console.error('[List Email Logs] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch email logs' } },
      { status: 500 }
    );
  }
});
