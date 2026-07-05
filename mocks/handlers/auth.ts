import { http, HttpResponse } from 'msw';

export const authHandlers = [
  http.post('/api/auth/send-otp', async ({ request }) => {
    const body = (await request.json()) as { phone?: string };
    if (!body.phone || !/^[6-9]\d{9}$/.test(body.phone)) {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid phone number' } },
        { status: 400 }
      );
    }
    return HttpResponse.json({ success: true, message: 'OTP sent successfully' });
  }),

  http.post('/api/auth/verify-otp', async ({ request }) => {
    const body = (await request.json()) as { phone?: string; otp?: string };
    if (!body.phone || !body.otp) {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Phone and OTP required' } },
        { status: 400 }
      );
    }
    if (body.otp !== '123456') {
      return HttpResponse.json(
        { error: { code: 'INVALID_OTP', message: 'Invalid OTP' } },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: { id: 'mock-user-id', name: 'Test User', phone: body.phone, role: 'STUDENT', status: 'ACTIVE' },
    });
  }),

  http.post('/api/auth/signup', async ({ request }) => {
    const body = (await request.json()) as { name?: string; phone?: string; otp?: string };
    if (!body.name || !body.phone || body.otp !== '123456') {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid signup data' } },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: { id: 'new-user-id', name: body.name, phone: body.phone, role: 'STUDENT', status: 'ACTIVE' },
    }, { status: 201 });
  }),

  http.post('/api/auth/refresh', async ({ request }) => {
    const body = (await request.json()) as { refreshToken?: string };
    if (!body.refreshToken) {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Refresh token required' } },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      accessToken: 'new-mock-access-token',
      refreshToken: 'new-mock-refresh-token',
    });
  }),

  http.post('/api/auth/logout', async ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing authorization header' } },
        { status: 401 }
      );
    }
    return HttpResponse.json({ success: true, message: 'Logged out successfully' });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { identifier?: string; password?: string };
    if (!body.identifier || !body.password) {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Identifier and password required' } },
        { status: 400 }
      );
    }
    if (body.identifier === 'suspended@test.com') {
      return HttpResponse.json(
        { error: { code: 'ACCOUNT_SUSPENDED', message: 'Account suspended' } },
        { status: 403 }
      );
    }
    if (body.identifier === 'wrong@test.com') {
      return HttpResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password' } },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: { id: 'mock-user-id', name: 'Password User', phone: body.identifier, role: 'STUDENT', status: 'ACTIVE' },
    });
  }),

  http.post('/api/auth/google', async ({ request }) => {
    const body = (await request.json()) as { credential?: string };
    if (!body.credential) {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Google credential required' } },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      accessToken: 'mock-google-access-token',
      refreshToken: 'mock-google-refresh-token',
      user: { id: 'google-user-id', name: 'Google User', email: 'google@example.com', role: 'STUDENT', status: 'ACTIVE' },
    });
  }),
];
