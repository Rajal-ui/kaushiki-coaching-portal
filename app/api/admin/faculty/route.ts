import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin only' } }, { status: 403 });
  }

  try {
    const faculty = await prisma.user.findMany({
      where: { role: 'FACULTY' },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        assignedBatches: {
          select: {
            id: true,
            seatsFilled: true,
            enrollments: { select: { id: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const data = faculty.map((f) => ({
      id: f.id,
      name: f.name,
      phone: f.phone,
      email: f.email,
      status: f.status,
      assignedBatchCount: f.assignedBatches.length,
      totalStudents: f.assignedBatches.reduce((sum, b) => sum + b.seatsFilled, 0),
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[List Faculty] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch faculty' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin only' } }, { status: 403 });
  }

  try {
    let body: { name: string; phone: string; email?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: { code: 'INVALID_JSON', message: 'Invalid request body' } }, { status: 400 });
    }

    if (!body.name || !body.phone) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'name and phone are required' } }, { status: 400 });
    }

    if (body.phone.length < 6) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid phone number' } }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { phone: body.phone } });
    if (existing) {
      return NextResponse.json({ error: { code: 'CONFLICT', message: 'User with this phone already exists' } }, { status: 409 });
    }

    const password = body.phone.slice(-6);
    const passwordHash = await bcrypt.hash(password, 10);

    const faculty = await prisma.user.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        passwordHash,
        role: 'FACULTY',
        status: 'ACTIVE',
        phoneVerified: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return NextResponse.json({ data: faculty }, { status: 201 });
  } catch (err) {
    console.error('[Create Faculty] Error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create faculty' } }, { status: 500 });
  }
}
