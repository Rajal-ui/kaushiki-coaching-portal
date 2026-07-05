import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin only' } }, { status: 403 });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get('search') || '';
  const trackId = url.searchParams.get('trackId') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)), 100);
  const skip = (page - 1) * limit;

  try {
    const where: Record<string, unknown> = { role: 'STUDENT' };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (trackId) {
      where.enrollments = {
        some: {
          batch: { subject: { trackId } },
        },
      };
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          status: true,
          enrollments: {
            where: { status: 'ACTIVE' },
            select: { id: true, batchId: true },
          },
          attendance: {
            select: { present: true },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { status: true },
          },
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.user.count({ where }),
    ]);

    const data = students.map((s) => {
      const totalAttendance = s.attendance.length;
      const presentAttendance = s.attendance.filter((a) => a.present).length;
      const attendanceAvg = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) / 100 : 0;

      return {
        id: s.id,
        name: s.name,
        phone: s.phone,
        email: s.email,
        status: s.status,
        activeBatchCount: s.enrollments.length,
        attendanceAvg,
        lastPaymentStatus: s.payments[0]?.status || null,
      };
    });

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Admin Students] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch students' } }, { status: 500 });
  }
}
