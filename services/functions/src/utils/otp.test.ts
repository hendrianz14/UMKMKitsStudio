import { describe, expect, it } from 'vitest';
import { generateOtpCode, getOtpExpiryDate, hashOtp, isOtpExpired, verifyOtp } from './otp.js';

describe('OTP utilities', () => {
  it('should generate a 6 digit numeric code', () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('should hash and verify OTP correctly', async () => {
    const code = '123456';
    const hash = await hashOtp(code);
    expect(hash).toBeTruthy();
    await expect(verifyOtp(code, hash)).resolves.toBe(true);
    await expect(verifyOtp('654321', hash)).resolves.toBe(false);
  });

  it('should produce expiry 10 minutes ahead', () => {
    const now = new Date('2024-01-01T00:00:00.000Z');
    const expiry = getOtpExpiryDate(now);
    expect(expiry.getTime() - now.getTime()).toBe(10 * 60 * 1000);
    expect(isOtpExpired(expiry, new Date(now.getTime() + 9 * 60 * 1000))).toBe(false);
    expect(isOtpExpired(expiry, new Date(now.getTime() + 11 * 60 * 1000))).toBe(true);
  });
});
