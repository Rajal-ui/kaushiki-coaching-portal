import { NextRequest, NextResponse } from 'next/server';
import { withRole, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { uploadFile, UploadError } from '@/lib/upload';

export const POST = withRole(['STUDENT', 'FACULTY', 'ADMIN'], async (req: NextRequest) => {
  const user = (req as AuthenticatedRequest).user!;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: 'MISSING_FILE', message: 'No file provided' } },
        { status: 400 }
      );
    }

    const result = await uploadFile(file);

    return NextResponse.json({
      url: result.url,
      name: result.fileName,
      mimeType: result.mimeType,
      size: result.size,
    }, { status: 201 });
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
});
