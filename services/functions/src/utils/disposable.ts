export const DISPOSABLE = new Set<string>([
  'mailinator.com',
  'yopmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'tempmail.com'
]);

export function isDisposableDomain(domain: string) {
  return DISPOSABLE.has(domain.toLowerCase());
}
