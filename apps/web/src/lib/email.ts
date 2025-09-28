export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getEmailDomain(email: string): string | null {
  const normalized = normalizeEmail(email);
  const atIndex = normalized.lastIndexOf("@");
  if (atIndex <= 0 || atIndex === normalized.length - 1) {
    return null;
  }
  return normalized.slice(atIndex + 1);
}

export function isAllowedDomain(email: string, allowedDomains: string[]): boolean {
  const domain = getEmailDomain(email);
  if (!domain) return false;
  const normalizedDomain = domain.toLowerCase();
  return allowedDomains.some((allowed) => normalizedDomain === allowed.toLowerCase());
}

export function isAllowedGmail(email: string): boolean {
  const domain = getEmailDomain(email);
  return domain === "gmail.com";
}

export function isValidEmailFormat(email: string): boolean {
  const normalized = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}
