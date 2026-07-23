import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/middleware';

export const GET = withRole('ADMIN', async (req) => {
  try {
    const attendanceRecords = await prisma.attendance.groupBy({
      by: ['studentId', 'batchId'],
      _count: { present: true },
      where: { present: true },
    });

    const totalAttendance = await prisma.attendance.groupBy({
      by: ['studentId', 'batchId'],
      _count: { id: true },
    });

    const attendanceMap = new Map<string, { present: number; total: number }>();
    for (const r of totalAttendance) {
      const key = `${r.studentId}:${r.batchId}`;
      attendanceMap.set(key, { present: 0, total: r._count.id });
    }
    for (const r of attendanceRecords) {
      const key = `${r.studentId}:${r.batchId}`;
      if (attendanceMap.has(key)) {
        attendanceMap.get(key)!.present = r._count.present;
      }
    }

    const lowAttendanceEntries: { studentId: string; batchId: string; percentage: number }[] = [];
    for (const [key, val] of attendanceMap) {
      if (val.total === 0) continue;
      const percentage = (val.present / val.total) * 100;
      if (percentage < 60) {
        const [studentId, batchId] = key.split(':');
        lowAttendanceEntries.push({ studentId, batchId, percentage });
      }
    }

    const studentIds = new Set<string>();
    const batchIds = new Set<string>();
    for (const e of lowAttendanceEntries) {
      studentIds.add(e.studentId);
      batchIds.add(e.batchId);
    }

    const testScores = await prisma.testScore.findMany({
      where: {
        studentId: { in: Array.from(studentIds.size > 0 ? studentIds : ['']) },
      },
      orderBy: [{ studentId: 'asc' }, { batchId: 'asc' }, { testDate: 'asc' }],
    });

    const failedTestsByStudent = new Map<string, { batchId: string; failCount: number }[]>();
    for (const t of testScores) {
      if (t.score / t.maxScore < 0.4) {
        const key = t.studentId;
        if (!failedTestsByStudent.has(key)) {
          failedTestsByStudent.set(key, []);
        }
        const entries = failedTestsByStudent.get(key)!;
        let entry = entries.find((e) => e.batchId === t.batchId);
        if (!entry) {
          entry = { batchId: t.batchId, failCount: 0 };
          entries.push(entry);
        }
        entry.failCount++;
      }
    }

    const lowAttendanceStudentIds = lowAttendanceEntries.map((e) => e.studentId);
    const scoreRiskStudentIds = Array.from(failedTestsByStudent.keys());

    const allRiskStudentIds = new Set([...lowAttendanceStudentIds, ...scoreRiskStudentIds]);
    if (allRiskStudentIds.size === 0) {
      return NextResponse.json({ data: [] });
    }

    const allBatchIds = new Set([...batchIds]);
    for (const entries of failedTestsByStudent.values()) {
      for (const e of entries) {
        allBatchIds.add(e.batchId);
      }
    }

    const [users, batches] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: Array.from(allRiskStudentIds) } },
        select: { id: true, name: true, phone: true },
      }),
      prisma.batch.findMany({
        where: { id: { in: Array.from(allBatchIds) } },
        select: { id: true, subject: { select: { name: true } } },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const batchMap = new Map(batches.map((b) => [b.id, b.subject.name]));

    const data: { studentId: string; studentName: string; phone: string; batchName: string; riskType: 'ATTENDANCE' | 'SCORES'; detail: string }[] = [];

    for (const e of lowAttendanceEntries) {
      const user = userMap.get(e.studentId);
      if (!user) continue;
      data.push({
        studentId: e.studentId,
        studentName: user.name,
        phone: user.phone ?? '',
        batchName: batchMap.get(e.batchId) || 'Unknown',
        riskType: 'ATTENDANCE' as const,
        detail: `Attendance ${e.percentage.toFixed(1)}% (${attendanceMap.get(`${e.studentId}:${e.batchId}`)?.present}/${attendanceMap.get(`${e.studentId}:${e.batchId}`)?.total} sessions)`,
      });
    }

    for (const [studentId, entries] of failedTestsByStudent) {
      const user = userMap.get(studentId);
      if (!user) continue;
      for (const e of entries) {
        if (e.failCount >= 2) {
          data.push({
            studentId,
            studentName: user.name,
            phone: user.phone ?? '',
            batchName: batchMap.get(e.batchId) || 'Unknown',
            riskType: 'SCORES' as const,
            detail: `${e.failCount} consecutive failed tests (score < 40%)`,
          });
        }
      }
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[Student Risks] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch student risks' } }, { status: 500 });
  }
});
