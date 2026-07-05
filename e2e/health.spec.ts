import { test, expect } from '@playwright/test';

test.describe('Health & API', () => {
  test('Health endpoint returns healthy', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(body.checks.database).toBe('ok');
    expect(body.checks.redis).toBe('ok');
  });

  test('Tracks API returns data', async ({ request }) => {
    const res = await request.get('/api/tracks');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(4);
  });
});
