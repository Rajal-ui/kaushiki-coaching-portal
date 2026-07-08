import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { uploadFile, UploadError } from '@/lib/upload';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req as AuthenticatedRequest);
  if (auth instanceof NextResponse) return auth;

  if (auth.user.role !== 'FACULTY' && auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only faculty and admins can upload files' } },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_FORM', message: 'Invalid form data' } },
      { status: 400 }
    );
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: { code: 'MISSING_FILE', message: 'No file provided' } },
      { status: 400 }
    );
  }

  try {
    const result = await uploadFile(file);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: 400 }
      );
    }
    console.error('[Upload] Error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to upload file' } },
      { status: 500 }
    );
  }
}
