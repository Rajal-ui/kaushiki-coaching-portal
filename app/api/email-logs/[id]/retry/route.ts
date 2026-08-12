import { NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import { retryEmailDispatch } from '@/lib/email/audit';

export const POST = withRole('ADMIN', async (req, { params }) => {
  const { id } = await params;

  try {
    const outcome = await retryEmailDispatch(id);

    if (outcome.ok) {
      return NextResponse.json({ success: true, message: outcome.message });
    }

    const statusByCode: Record<string, number> = {
      NOT_FOUND: 404,
      INVALID_STATUS: 400,
      NO_PAYLOAD: 400,
      SEND_FAILED: 502,
    };

    return NextResponse.json(
      { error: { code: outcome.code, message: outcome.message } },
      { status: statusByCode[outcome.code] ?? 500 }
    );
  } catch (err) {
    console.error('[Email Log Retry] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retry email' } },
      { status: 500 }
    );
  }
});
