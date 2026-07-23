import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/middleware';

export const GET = withRole('ADMIN', async (req, { params }) => {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        enrollments: {
          include: {
            batch: {
              select: {
                id: true,
                schedule: true,
                status: true,
                subject: { select: { id: true, name: true, track: { select: { id: true, name: true } } } },
                faculty: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { enrolledAt: 'desc' },
        },
        attendance: {
          select: { id: true, batchId: true, sessionDate: true, present: true },
          orderBy: { sessionDate: 'desc' },
        },
        testScores: {
          select: { id: true, batchId: true, testName: true, score: true, maxScore: true, testDate: true },
          orderBy: { testDate: 'desc' },
        },
        payments: {
          include: {
            enrollment: { select: { batch: { select: { subject: { select: { name: true } } } } } },
          },
          orderBy: { createdAt: 'desc' },
        },
        doubtQueries: {
          include: {
            batch: { select: { subject: { select: { name: true } } } },
            respondedBy: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        studentLinks: {
          where: { status: 'APPROVED' },
          include: { parent: { select: { id: true, name: true, phone: true, email: true } } },
        },
      },
    });

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Student not found' } }, { status: 404 });
    }

    const attendanceStats = {
      total: user.attendance.length,
      present: user.attendance.filter((a) => a.present).length,
      absent: user.attendance.filter((a) => !a.present).length,
      percentage: user.attendance.length > 0 ? Math.round((user.attendance.filter((a) => a.present).length / user.attendance.length) * 10000) / 100 : 0,
    };

    return NextResponse.json({
      data: {
        ...user,
        attendanceStats,
      },
    });
  } catch (err) {
    console.error('[Student Profile] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch student profile' } }, { status: 500 });
  }
});

export const PATCH = withRole('ADMIN', async (req, { params }) => {
  try {
    const { id } = await params;

    let body: { status?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: { code: 'INVALID_JSON', message: 'Invalid request body' } }, { status: 400 });
    }

    if (!body.status || !['ACTIVE', 'SUSPENDED'].includes(body.status)) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'status must be ACTIVE or SUSPENDED' } }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.role !== 'STUDENT') {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Student not found' } }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: body.status as 'ACTIVE' | 'SUSPENDED' },
      select: { id: true, name: true, status: true },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('[Update Student] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update student' } }, { status: 500 });
  }
});
