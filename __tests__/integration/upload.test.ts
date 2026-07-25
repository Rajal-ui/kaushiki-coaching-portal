/**
 * @jest-environment node
 */
import { POST } from '@/app/api/uploads/route';
import * as uploadModule from '@/lib/upload';

jest.mock('@/lib/auth/middleware', () => ({
  withRole: (_roles: string[], handler: any) => handler,
}));

jest.mock('@/lib/upload', () => {
  const actual = jest.requireActual('@/lib/upload');
  return {
    ...actual,
    uploadFile: jest.fn(),
  };
});

describe('POST /api/uploads', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uploads a file successfully', async () => {
    (uploadModule.uploadFile as jest.Mock).mockResolvedValue({
      url: '/uploads/test.pdf',
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
      size: 12,
    });

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', file);

    const req = new Request('http://localhost/api/uploads', {
      method: 'POST',
      body: formData,
      headers: { Authorization: 'Bearer fake-token' },
    });

    const res = await POST(req as any, { params: Promise.resolve({}) });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.url).toBe('/uploads/test.pdf');
    expect(body.name).toBe('test.pdf');
  });

  it('returns 400 when no file provided', async () => {
    const formData = new FormData();
    const req = new Request('http://localhost/api/uploads', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req as any, { params: Promise.resolve({}) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('MISSING_FILE');
  });

  it('returns 400 on UploadError', async () => {
    const err = new uploadModule.UploadError('INVALID_FILE_TYPE', 'Bad type');
    (uploadModule.uploadFile as jest.Mock).mockRejectedValue(err);

    const file = new File(['x'], 'bad.exe', { type: 'application/exe' });
    const formData = new FormData();
    formData.append('file', file);

    const req = new Request('http://localhost/api/uploads', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req as any, { params: Promise.resolve({}) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('INVALID_FILE_TYPE');
  });

  it('returns 500 on unexpected errors', async () => {
    (uploadModule.uploadFile as jest.Mock).mockRejectedValue(new Error('disk full'));

    const file = new File(['x'], 'ok.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', file);

    const req = new Request('http://localhost/api/uploads', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req as any, { params: Promise.resolve({}) });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
