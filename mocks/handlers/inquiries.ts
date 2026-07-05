import { http, HttpResponse } from 'msw';

const inquiryStore: Array<Record<string, unknown>> = [];

export const inquiryHandlers = [
  http.post('/api/inquiries', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.honeypot) {
      return HttpResponse.json({ error: { code: 'BOT_DETECTED', message: 'Spam detected' } }, { status: 400 });
    }
    const inquiry = { id: String(inquiryStore.length + 1), ...body, status: 'NEW', assignee: null, createdAt: new Date().toISOString() };
    inquiryStore.push(inquiry);
    return HttpResponse.json(inquiry, { status: 201 });
  }),

  http.get('/api/inquiries', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const paginated = inquiryStore.slice((page - 1) * limit, page * limit);
    return HttpResponse.json({
      data: paginated,
      pagination: { page, limit, total: inquiryStore.length, totalPages: Math.ceil(inquiryStore.length / limit) },
    });
  }),

  http.patch('/api/inquiries/:id', async ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ id: '1', name: 'Test', phone: '9876543210', status: body.status || 'NEW', assignee: body.assigneeId ? { id: body.assigneeId, name: 'Staff' } : null });
  }),
];
