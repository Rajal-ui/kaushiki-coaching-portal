import { generateOtp, hashOtp, verifyOtpHash, isEmail, detectChannel, buildOtpRedisKey, buildRateLimitRedisKey, OTP_LENGTH, MAX_ATTEMPTS, RATE_LIMIT_MAX } from '@/lib/auth/otp';

describe('OTP Generation', () => {
  it('generates a 6-digit OTP', () => {
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
    expect(otp.length).toBe(OTP_LENGTH);
  });

  it('generates different OTPs on consecutive calls', () => {
    const otps = new Set<string>();
    for (let i = 0; i < 100; i++) {
      otps.add(generateOtp());
    }
    expect(otps.size).toBeGreaterThan(90);
  });

  it('does not use Math.random (uses crypto)', () => {
    const cryptoSpy = jest.spyOn(globalThis.crypto, 'randomUUID');
    const mathSpy = jest.spyOn(Math, 'random');
    generateOtp();
    expect(cryptoSpy).not.toHaveBeenCalled();
    expect(mathSpy).not.toHaveBeenCalled();
    cryptoSpy.mockRestore();
    mathSpy.mockRestore();
  });

  it('has sufficient entropy for 6-digit OTP', () => {
    const results: number[] = [];
    for (let i = 0; i < 10000; i++) {
      results.push(parseInt(generateOtp(), 10));
    }
    const unique = new Set(results);
    expect(unique.size).toBeGreaterThan(9000);
  });
});

describe('OTP Hashing', () => {
  it('hashes OTP correctly', async () => {
    const otp = '123456';
    const hash = await hashOtp(otp);
    expect(hash).not.toBe(otp);
    expect(hash).toMatch(/^\$2[ab]\$/);
  });

  it('verifies correct OTP against hash', async () => {
    const otp = '654321';
    const hash = await hashOtp(otp);
    const isValid = await verifyOtpHash(otp, hash);
    expect(isValid).toBe(true);
  });

  it('rejects incorrect OTP against hash', async () => {
    const hash = await hashOtp('111111');
    const isValid = await verifyOtpHash('222222', hash);
    expect(isValid).toBe(false);
  });
});

describe('Channel Detection', () => {
  it('identifies email addresses', () => {
    expect(isEmail('user@example.com')).toBe(true);
    expect(isEmail('test.co@domain.org')).toBe(true);
    expect(isEmail('a+b@domain.com')).toBe(true);
  });

  it('rejects non-email strings', () => {
    expect(isEmail('9876543210')).toBe(false);
    expect(isEmail('+919876543210')).toBe(false);
    expect(isEmail('hello')).toBe(false);
    expect(isEmail('')).toBe(false);
  });

  it('detectChannel returns email for emails', () => {
    expect(detectChannel('user@example.com')).toBe('email');
  });

  it('detectChannel returns sms for phone numbers', () => {
    expect(detectChannel('9876543210')).toBe('sms');
  });
});

describe('Redis Key Builders', () => {
  it('builds SMS OTP key', () => {
    expect(buildOtpRedisKey('9876543210')).toBe('otp:sms:9876543210');
  });

  it('builds email OTP key', () => {
    expect(buildOtpRedisKey('user@example.com')).toBe('otp:email:user@example.com');
  });

  it('builds key with explicit channel', () => {
    expect(buildOtpRedisKey('9876543210', 'sms')).toBe('otp:sms:9876543210');
    expect(buildOtpRedisKey('user@example.com', 'email')).toBe('otp:email:user@example.com');
  });

  it('builds SMS rate limit key', () => {
    expect(buildRateLimitRedisKey('9876543210')).toBe('otp:ratelimit:sms:9876543210');
  });

  it('builds email rate limit key', () => {
    expect(buildRateLimitRedisKey('user@example.com')).toBe('otp:ratelimit:email:user@example.com');
  });
});

describe('OTP Constants', () => {
  it('has correct max attempts', () => {
    expect(MAX_ATTEMPTS).toBe(3);
  });

  it('has correct rate limit max', () => {
    expect(RATE_LIMIT_MAX).toBe(5);
  });
});
