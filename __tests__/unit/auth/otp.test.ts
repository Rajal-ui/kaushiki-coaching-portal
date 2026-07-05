import { generateOtp, hashOtp, verifyOtpHash, OTP_LENGTH, MAX_ATTEMPTS, RATE_LIMIT_MAX } from '@/lib/auth/otp';

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

describe('OTP Constants', () => {
  it('has correct max attempts', () => {
    expect(MAX_ATTEMPTS).toBe(3);
  });

  it('has correct rate limit max', () => {
    expect(RATE_LIMIT_MAX).toBe(5);
  });
});
