import { describe, expect, it, beforeAll } from 'vitest';
import { decrypt, encrypt } from './crypto.js';

describe('crypto helpers', () => {
  beforeAll(() => {
    process.env.ENCRYPTION_SECRET = 'super_secure_secret_value_32_chars_long';
  });

  it('encrypts and decrypts symmetrically', () => {
    const message = 'Gemini API key';
    const encrypted = encrypt(message);
    expect(encrypted).not.toBe(message);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(message);
  });
});
