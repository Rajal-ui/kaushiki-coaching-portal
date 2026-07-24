import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/middleware';
import { createInquirySchema, inquiryQuerySchema } from '@/lib/validators/inquiries';
import { getClientIp, checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export const GET = withRole(['ADMIN'], async (req) => {
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const parsed = inquiryQuerySchema.safeParse(query);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { page, limit, status, trackId, assigneeId } = parsed.data;

  try {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (trackId) where.trackId = trackId;
    if (assigneeId) where.assigneeId = assigneeId;

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inquiry.count({ where }),
    ]);

    return NextResponse.json({
      data: inquiries,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[List Inquiries] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch inquiries' } },
      { status: 500 }
    );
  }
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimitResult = await checkRateLimit(`inquiry:ratelimit:${ip}`, 5, 3600);
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult.retryAfter);
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

  const parsed = createInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message, details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { honeypot, ...data } = parsed.data;
  if (honeypot) {
    return NextResponse.json(
      { error: { code: 'BOT_DETECTED', message: 'Spam detected' } },
      { status: 400 }
    );
  }

  try {
    const inquiry = await prisma.inquiry.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        trackId: data.trackId || null,
        message: data.message,
      },
    });

    return NextResponse.json(inquiry, { status: 201 });
  } catch (err) {
    console.error('[Create Inquiry] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to submit inquiry' } },
      { status: 500 }
    );
  }
}
