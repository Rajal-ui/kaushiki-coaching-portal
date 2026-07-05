import { http, HttpResponse } from 'msw';

const enrollmentsStore: Array<Record<string, unknown>> = [];

export const enrollmentHandlers = [
  http.post('/api/enrollments', async ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    try {
      const body = (await request.json()) as Record<string, unknown>;
      const enrollment = {
        id: `enr-${enrollmentsStore.length + 1}`,
        studentId: 'student-1',
        batchId: body.batchId as string,
        status: 'PENDING',
        batch: { id: body.batchId, capacity: 30, schedule: 'Mon/Wed 4-5 PM', subject: { name: 'Mathematics' }, faculty: { name: 'Faculty' } },
        payment: { id: 'pay-1', amount: 500000, status: 'PENDING', gatewayOrderId: 'order_mock' },
      };
      enrollmentsStore.push(enrollment);
      return HttpResponse.json({
        enrollment,
        payment: enrollment.payment,
        razorpayOrderId: 'order_mock',
        razorpayKeyId: 'rzp_test_key',
        amount: 500000,
      }, { status: 201 });
    } catch {
      return HttpResponse.json({ error: { code: 'INVALID_JSON' } }, { status: 400 });
    }
  }),

  http.get('/api/enrollments/me', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    return HttpResponse.json({ data: enrollmentsStore });
  }),

  http.get('/api/enrollments', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    return HttpResponse.json({ data: enrollmentsStore, pagination: { page: 1, limit: 20, total: enrollmentsStore.length, totalPages: 1 } });
  }),

  http.post('/api/payments/create-order', async ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    return HttpResponse.json({ orderId: 'order_mock', keyId: 'rzp_test_key', amount: 500000, currency: 'INR' });
  }),

  http.post('/api/payments/webhook', async ({ request }) => {
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) return HttpResponse.json({ error: { code: 'INVALID_SIGNATURE' } }, { status: 400 });
    return HttpResponse.json({ status: 'processed' });
  }),

  http.post('/api/payments/:id/refund', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    return HttpResponse.json({ success: true, message: 'Payment refunded successfully' });
  }),

  http.post('/api/links', async ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    return HttpResponse.json({ id: 'link-1', parentId: 'parent-1', studentId: 'student-1', status: 'PENDING' }, { status: 201 });
  }),

  http.get('/api/links', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    return HttpResponse.json({ data: [] });
  }),

  http.post('/api/links/:id/approve', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    return HttpResponse.json({ id: 'link-1', parentId: 'parent-1', studentId: 'student-1', status: 'APPROVED' });
  }),

  http.post('/api/attendance/bulk', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    return HttpResponse.json({ created: 2, updated: 0 }, { status: 201 });
  }),

  http.get('/api/attendance', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    return HttpResponse.json({ data: [] });
  }),

  http.post('/api/scores', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    return HttpResponse.json({ data: [], count: 0 }, { status: 201 });
  }),

  http.get('/api/scores', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    return HttpResponse.json({ data: [] });
  }),
];
