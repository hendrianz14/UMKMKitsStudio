import bcrypt from 'bcryptjs';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 10 * 60 * 1000;

export function generateOtpCode() {
  const code = Math.floor(Math.random() * 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, '0');
  return code;
}

export async function hashOtp(code: string) {
  return bcrypt.hash(code, 10);
}

export async function verifyOtp(code: string, hash: string) {
  return bcrypt.compare(code, hash);
}

export function getOtpExpiryDate(now = new Date()) {
  return new Date(now.getTime() + OTP_EXPIRY_MS);
}

export function isOtpExpired(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() <= now.getTime();
}

export { OTP_LENGTH, OTP_EXPIRY_MS };
