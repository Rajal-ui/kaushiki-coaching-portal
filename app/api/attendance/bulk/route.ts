import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { bulkAttendanceSchema } from '@/lib/validators/attendance';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'FACULTY' && auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only faculty and admins can mark attendance' } },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = bulkAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { batchId, sessionDate, records } = parsed.data;

  try {
    if (auth.user.role === 'FACULTY') {
      const batch = await prisma.batch.findUnique({ where: { id: batchId }, select: { facultyId: true } });
      if (!batch || batch.facultyId !== auth.user.id) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Not your batch' } },
          { status: 403 }
        );
      }
    }

    const date = new Date(sessionDate);

    const result = await prisma.$transaction(async (tx) => {
      let created = 0;
      let updated = 0;

      for (const record of records) {
        const existing = await tx.attendance.findUnique({
          where: {
            batchId_studentId_sessionDate: {
              batchId,
              studentId: record.studentId,
              sessionDate: date,
            },
          },
        });

        if (existing) {
          await tx.attendance.update({
            where: { id: existing.id },
            data: { present: record.present, markedById: auth.user.id },
          });
          updated++;
        } else {
          await tx.attendance.create({
            data: {
              batchId,
              studentId: record.studentId,
              sessionDate: date,
              present: record.present,
              markedById: auth.user.id,
            },
          });
          created++;
        }
      }

      return { created, updated };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('[Bulk Attendance] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to mark attendance' } },
      { status: 500 }
    );
  }
}
