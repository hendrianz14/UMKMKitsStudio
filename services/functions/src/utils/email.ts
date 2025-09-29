import dns from 'node:dns/promises';
import { isDisposableDomain } from './disposable.js';

export function getEmailDomain(email: string) {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

export function assertEmailAllowed(email: string) {
  const domain = getEmailDomain(email);
  if (!domain) {
    throw new Error('Email tidak valid');
  }
  if (isDisposableDomain(domain)) {
    const error = new Error('Domain email tidak didukung.');
    error.name = 'DISPOSABLE_DOMAIN';
    throw error;
  }
  return domain;
}

export async function ensureDomainHasMx(domain: string) {
  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) {
      throw new Error('Domain email tidak memiliki MX');
    }
  } catch (error) {
    const err = new Error('Domain email tidak memiliki MX');
    err.name = 'MISSING_MX';
    throw err;
  }
}
