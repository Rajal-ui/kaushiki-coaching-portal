import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin only' } }, { status: 403 });
  }

  try {
    const { id } = await params;

    const faculty = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        assignedBatches: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            schedule: true,
            capacity: true,
            seatsFilled: true,
            subject: { select: { id: true, name: true, track: { select: { name: true } } } },
            attendance: { select: { present: true } },
            testScores: { select: { score: true, maxScore: true } },
          },
        },
      },
    });

    if (!faculty || faculty.role !== 'FACULTY') {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Faculty not found' } }, { status: 404 });
    }

    const batchesWithAnalytics = faculty.assignedBatches.map((b) => {
      const totalAttendance = b.attendance.length;
      const presentAttendance = b.attendance.filter((a) => a.present).length;
      const avgAttendance = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 10000) / 100 : 0;

      const totalScoreRecords = b.testScores.length;
      const avgScore = totalScoreRecords > 0
        ? Math.round((b.testScores.reduce((sum, t) => sum + t.score / t.maxScore, 0) / totalScoreRecords) * 10000) / 100
        : 0;

      return {
        id: b.id,
        subject: b.subject.name,
        track: b.subject.track.name,
        schedule: b.schedule,
        capacity: b.capacity,
        seatsFilled: b.seatsFilled,
        avgAttendance,
        avgTestScore: avgScore,
      };
    });

    return NextResponse.json({
      data: {
        id: faculty.id,
        name: faculty.name,
        phone: faculty.phone,
        email: faculty.email,
        role: faculty.role,
        status: faculty.status,
        createdAt: faculty.createdAt,
        batches: batchesWithAnalytics,
      },
    });
  } catch (err) {
    console.error('[Faculty Profile] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch faculty profile' } }, { status: 500 });
  }
}
