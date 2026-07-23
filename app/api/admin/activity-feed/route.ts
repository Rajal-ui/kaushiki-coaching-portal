import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/middleware';

export const GET = withRole('ADMIN', async (req) => {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 100);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    const [inquiries, enrollments, payments, doubts] = await Promise.all([
      prisma.inquiry.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: limit * 2,
      }),
      prisma.enrollment.findMany({
        where: { enrolledAt: { gte: thirtyDaysAgo } },
        select: { id: true, student: { select: { name: true } }, batch: { select: { subject: { select: { name: true } } } }, enrolledAt: true },
        orderBy: { enrolledAt: 'desc' },
        take: limit * 2,
      }),
      prisma.payment.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { in: ['SUCCEEDED', 'FAILED'] },
        },
        select: { id: true, status: true, amount: true, payer: { select: { name: true } }, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: limit * 2,
      }),
      prisma.doubtQuery.findMany({
        where: {
          respondedAt: { gte: thirtyDaysAgo },
          status: 'ANSWERED',
        },
        select: { id: true, student: { select: { name: true } }, respondedAt: true },
        orderBy: { respondedAt: 'desc' },
        take: limit * 2,
      }),
    ]);

    const events: { id: string; type: 'inquiry' | 'enrollment' | 'payment' | 'doubt'; description: string; timestamp: Date; icon?: string }[] = [];

    for (const i of inquiries) {
      events.push({
        id: i.id,
        type: 'inquiry',
        description: `New inquiry from ${i.name}`,
        timestamp: i.createdAt,
        icon: '📋',
      });
    }

    for (const e of enrollments) {
      events.push({
        id: e.id,
        type: 'enrollment',
        description: `${e.student.name} enrolled in ${e.batch.subject.name}`,
        timestamp: e.enrolledAt,
        icon: '🎓',
      });
    }

    for (const p of payments) {
      events.push({
        id: p.id,
        type: 'payment',
        description: `${p.status === 'SUCCEEDED' ? 'Payment received' : 'Payment failed'} from ${p.payer.name} - ₹${(p.amount / 100).toFixed(2)}`,
        timestamp: p.createdAt,
        icon: p.status === 'SUCCEEDED' ? '✅' : '❌',
      });
    }

    for (const d of doubts) {
      events.push({
        id: d.id,
        type: 'doubt',
        description: `Doubt answered for ${d.student.name}`,
        timestamp: d.respondedAt!,
        icon: '💡',
      });
    }

    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return NextResponse.json(events.slice(0, limit));
  } catch (err) {
    console.error('[Activity Feed] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch activity feed' } }, { status: 500 });
  }
});
