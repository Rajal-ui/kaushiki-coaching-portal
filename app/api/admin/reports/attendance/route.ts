import { NextResponse } from 'next/server';
import { stringify } from 'csv-stringify/sync';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/middleware';

export const GET = withRole('ADMIN', async (req) => {
  const url = new URL(req.url);
  const batchId = url.searchParams.get('batchId');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const format = url.searchParams.get('format');

  if (!batchId) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'batchId query param required' } }, { status: 400 });
  }

  try {
    const where: Record<string, unknown> = { batchId };
    if (from) where.sessionDate = { gte: new Date(from) };
    if (to) {
      where.sessionDate = { ...(where.sessionDate as Record<string, unknown> || {}), lte: new Date(to) };
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where,
      select: {
        studentId: true,
        present: true,
        sessionDate: true,
        student: { select: { name: true, phone: true } },
      },
      orderBy: [{ studentId: 'asc' }, { sessionDate: 'asc' }],
    });

    const studentAttendance = new Map<string, { name: string; phone: string; sessions: number; present: number }>();
    for (const r of attendanceRecords) {
      if (!studentAttendance.has(r.studentId)) {
        studentAttendance.set(r.studentId, { name: r.student.name, phone: r.student.phone ?? '', sessions: 0, present: 0 });
      }
      const entry = studentAttendance.get(r.studentId)!;
      entry.sessions++;
      if (r.present) entry.present++;
    }

    const data = Array.from(studentAttendance.entries()).map(([studentId, stats]) => ({
      studentId,
      studentName: stats.name,
      phone: stats.phone,
      sessionsAttended: stats.present,
      totalSessions: stats.sessions,
      percentage: stats.sessions > 0 ? Math.round((stats.present / stats.sessions) * 10000) / 100 : 0,
    }));

    if (format === 'csv') {
      const csv = stringify(data, { header: true });
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="attendance-report.csv"',
        },
      });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[Attendance Report] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to generate report' } }, { status: 500 });
  }
});
