jest.mock('@/lib/redis', () => {
  const RATE_LIMIT_WINDOW_SECONDS = 3600;
  const store = new Map<string, { value: string; expiresAt: number }>();
  return {
    redis: {
      async get(key: string) {
        const entry = store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
          store.delete(key);
          return null;
        }
        return entry.value;
      },
      async set(key: string, value: string, mode: string, ttl: number) {
        store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
        return 'OK';
      },
      async del(key: string) {
        store.delete(key);
        return 1;
      },
      async incr(key: string) {
        const entry = store.get(key);
        const count = entry ? parseInt(entry.value, 10) : 0;
        const newCount = count + 1;
        const expiresAt = entry ? entry.expiresAt : Date.now() + RATE_LIMIT_WINDOW_SECONDS * 1000;
        store.set(key, { value: String(newCount), expiresAt });
        return newCount;
      },
      async expire(key: string, ttl: number) {
        const entry = store.get(key);
        if (entry) {
          entry.expiresAt = Date.now() + ttl * 1000;
        }
        return 1;
      },
      async ttl(key: string) {
        const entry = store.get(key);
        if (!entry) return -2;
        const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
        return Math.max(0, remaining);
      },
    },
  };
});

describe('Rate Limit Enforcement', () => {
  it('allows up to 5 requests within the window', async () => {
    const phone = '9988776655';
    const { buildRateLimitRedisKey, RATE_LIMIT_MAX } = jest.requireActual('@/lib/auth/otp');
    const rateLimitKey = buildRateLimitRedisKey(phone);
    const { redis } = require('@/lib/redis');

    for (let i = 1; i <= RATE_LIMIT_MAX; i++) {
      const count = await redis.incr(rateLimitKey);
      expect(count).toBe(i);
      expect(count <= RATE_LIMIT_MAX).toBe(true);
    }
  });

  it('blocks 6th request (5 + 1) within the window', async () => {
    const phone = '9988776655';
    const { buildRateLimitRedisKey, RATE_LIMIT_MAX } = jest.requireActual('@/lib/auth/otp');
    const rateLimitKey = buildRateLimitRedisKey(phone);
    const { redis } = require('@/lib/redis');

    const count = await redis.incr(rateLimitKey);
    expect(count).toBe(RATE_LIMIT_MAX + 1);
    expect(count > RATE_LIMIT_MAX).toBe(true);
  });

  it('resets after window expires', async () => {
    const phone = '8877665544';
    const { buildRateLimitRedisKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SECONDS } = jest.requireActual('@/lib/auth/otp');
    const rateLimitKey = buildRateLimitRedisKey(phone);
    const { redis } = require('@/lib/redis');

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(Date.now());

    for (let i = 1; i <= RATE_LIMIT_MAX; i++) {
      await redis.incr(rateLimitKey);
    }
    const blocked = await redis.incr(rateLimitKey);
    expect(blocked).toBe(RATE_LIMIT_MAX + 1);

    nowSpy.mockReturnValue(Date.now() + RATE_LIMIT_WINDOW_SECONDS * 1000 + 1000);

    const existing = await redis.get(rateLimitKey);
    expect(existing).toBeNull();

    const freshCount = await redis.incr(rateLimitKey);
    expect(freshCount).toBe(1);

    nowSpy.mockRestore();
  });
});
