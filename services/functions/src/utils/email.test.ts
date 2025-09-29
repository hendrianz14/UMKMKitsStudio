import dns from 'node:dns/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertEmailAllowed, ensureDomainHasMx, getEmailDomain } from './email.js';

describe('email utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('extracts domain correctly', () => {
    expect(getEmailDomain('user@example.com')).toBe('example.com');
  });

  it('throws for disposable domain', () => {
    expect(() => assertEmailAllowed('user@mailinator.com')).toThrow('Domain email tidak didukung.');
  });

  it('validates MX records', async () => {
    vi.spyOn(dns, 'resolveMx').mockResolvedValue([{ exchange: 'mx.example.com' } as dns.MxRecord]);
    await expect(ensureDomainHasMx('example.com')).resolves.toBeUndefined();
  });

  it('fails when MX is missing', async () => {
    vi.spyOn(dns, 'resolveMx').mockResolvedValue([]);
    await expect(ensureDomainHasMx('missing.com')).rejects.toThrow('Domain email tidak memiliki MX');
  });
});
