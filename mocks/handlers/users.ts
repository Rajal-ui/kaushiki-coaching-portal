import { http, HttpResponse } from 'msw';

export const userHandlers = [
  http.get('/api/users', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    if (role === 'FACULTY') {
      return HttpResponse.json([
        { id: 'fac-1', name: 'Dr. Sharma', phone: '9111111111', role: 'FACULTY' },
        { id: 'fac-2', name: 'Ms. Patel', phone: '9222222222', role: 'FACULTY' },
      ]);
    }
    return HttpResponse.json([]);
  }),
];
