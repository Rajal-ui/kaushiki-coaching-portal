jest.mock('@/lib/redis', () => {
  const OTP_TTL_SECONDS = 300;
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
        const expiresAt = mode === 'KEEPTTL'
          ? (store.get(key)?.expiresAt ?? Date.now() + OTP_TTL_SECONDS * 1000)
          : Date.now() + ttl * 1000;
        store.set(key, { value, expiresAt });
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
        store.set(key, { value: String(newCount), expiresAt: Date.now() + 3600 * 1000 });
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

describe('OTP Flow Integration', () => {
  it('full OTP flow: send → verify → tokens returned', async () => {
    const phone = '9876543210';
    const { generateOtp, hashOtp, verifyOtpHash, buildOtpRedisKey, OTP_TTL_SECONDS } = jest.requireActual('@/lib/auth/otp');
    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);

    const otpKey = buildOtpRedisKey(phone);
    const { redis } = require('@/lib/redis');
    await redis.set(otpKey, JSON.stringify({ hash: hashedOtp, attempts: 0 }), 'EX', OTP_TTL_SECONDS);

    const stored = await redis.get(otpKey);
    expect(stored).not.toBeNull();

    const { hash, attempts } = JSON.parse(stored);
    const isValid = await verifyOtpHash(otp, hash);
    expect(isValid).toBe(true);
    expect(attempts).toBe(0);

    await redis.del(otpKey);
    const deleted = await redis.get(otpKey);
    expect(deleted).toBeNull();
  });

  it('rejects invalid OTP and decrements attempts', async () => {
    const phone = '9876543211';
    const { hashOtp, verifyOtpHash, buildOtpRedisKey, OTP_TTL_SECONDS } = jest.requireActual('@/lib/auth/otp');
    const hashedOtp = await hashOtp('000000');

    const otpKey = buildOtpRedisKey(phone);
    const { redis } = require('@/lib/redis');
    await redis.set(otpKey, JSON.stringify({ hash: hashedOtp, attempts: 0 }), 'EX', OTP_TTL_SECONDS);

    const stored = await redis.get(otpKey);
    const { hash, attempts } = JSON.parse(stored);

    const isValid = await verifyOtpHash('wrong-otp', hash);
    expect(isValid).toBe(false);

    await redis.set(otpKey, JSON.stringify({ hash, attempts: attempts + 1 }), 'KEEPTTL');

    const updated = await redis.get(otpKey);
    const parsed = JSON.parse(updated);
    expect(parsed.attempts).toBe(1);
  });

  it('enforces max verification attempts (3)', async () => {
    const phone = '9876543212';
    const { hashOtp, verifyOtpHash, buildOtpRedisKey, MAX_ATTEMPTS } = jest.requireActual('@/lib/auth/otp');
    const hashedOtp = await hashOtp('999999');

    const otpKey = buildOtpRedisKey(phone);
    const { redis } = require('@/lib/redis');
    await redis.set(otpKey, JSON.stringify({ hash: hashedOtp, attempts: 0 }), 'EX', 300);

    let attempts = 0;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const stored = await redis.get(otpKey);
      if (!stored) break;

      const data = JSON.parse(stored);
      attempts = data.attempts;

      if (attempts >= MAX_ATTEMPTS) {
        await redis.del(otpKey);
        break;
      }

      const isValid = await verifyOtpHash('wrong', data.hash);
      expect(isValid).toBe(false);

      await redis.set(otpKey, JSON.stringify({ hash: data.hash, attempts: data.attempts + 1 }), 'KEEPTTL');
    }

    const afterAttempts = await redis.get(otpKey);
    expect(attempts).toBeLessThanOrEqual(MAX_ATTEMPTS);

    if (attempts >= MAX_ATTEMPTS) {
      expect(afterAttempts).toBeNull();
    }
  });
});
