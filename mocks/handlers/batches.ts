import { http, HttpResponse } from 'msw';

const trackData = [
  { id: 'track-1', name: 'CLASSES_6_10', boardCoverage: null, displayOrder: 1, subjects: [{ id: 'subj-1', name: 'Mathematics' }, { id: 'subj-2', name: 'Science' }] },
  { id: 'track-2', name: 'CLASSES_11_12_COMMERCE', boardCoverage: null, displayOrder: 2, subjects: [{ id: 'subj-3', name: 'Accountancy' }, { id: 'subj-4', name: 'Economics' }] },
];

const batchesStore: Array<Record<string, unknown>> = [];

export const batchHandlers = [
  http.get('/api/tracks', () => {
    return HttpResponse.json(trackData);
  }),

  http.get('/api/batches', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const paginated = batchesStore.slice((page - 1) * limit, page * limit);
    return HttpResponse.json({
      data: paginated.map(b => ({
        ...b,
        subject: { id: b.subjectId, name: 'Mathematics', trackId: 'track-1', track: { name: 'CLASSES_6_10' } },
        faculty: { id: b.facultyId, name: 'Faculty Member' },
      })),
      pagination: { page, limit, total: batchesStore.length, totalPages: Math.ceil(batchesStore.length / limit) },
    });
  }),

  http.post('/api/batches', async ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    try {
      const body = (await request.json()) as Record<string, unknown>;
      if (body.facultyId === 'non-faculty-id') {
        return HttpResponse.json({ error: { code: 'INVALID_FACULTY', message: 'Invalid faculty member' } }, { status: 400 });
      }
      const batch = { id: String(batchesStore.length + 1), subjectId: body.subjectId as string, facultyId: body.facultyId as string, capacity: body.capacity as number, seatsFilled: 0, schedule: body.schedule as string, status: 'ACTIVE' };
      batchesStore.push(batch);
      return HttpResponse.json({
        ...batch,
        subject: { id: batch.subjectId, name: 'Mathematics', trackId: 'track-1', track: { name: 'CLASSES_6_10' } },
        faculty: { id: batch.facultyId, name: 'Faculty Member' },
      }, { status: 201 });
    } catch {
      return HttpResponse.json({ error: { code: 'INVALID_JSON' } }, { status: 400 });
    }
  }),

  http.patch('/api/batches/:id', async ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    return HttpResponse.json({ id: '1', subjectId: 'subj-1', facultyId: 'fac-1', capacity: 30, seatsFilled: 0, schedule: 'Mon/Wed 4-5 PM', status: 'ACTIVE' });
  }),

  http.get('/api/batches/my', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    return HttpResponse.json([
      { id: 'batch-1', capacity: 30, seatsFilled: 15, schedule: 'Mon/Wed 4-5 PM', subject: { name: 'Mathematics', track: { name: 'CLASSES_6_10' } } },
      { id: 'batch-2', capacity: 25, seatsFilled: 22, schedule: 'Tue/Thu 5-6 PM', subject: { name: 'Science', track: { name: 'CLASSES_6_10' } } },
    ]);
  }),

  http.get('/api/batches/:id/roster', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    return HttpResponse.json({
      batch: { id: 'batch-1', subject: 'Mathematics', seatsFilled: 2, capacity: 30 },
      students: [
        { id: 'student-1', name: 'Alice', phone: '9876543210', email: null },
        { id: 'student-2', name: 'Bob', phone: '9876543211', email: null },
      ],
    });
  }),
];
