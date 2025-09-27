import { headers } from 'next/headers';

export async function getBaseUrl() {
  const env = process.env.APP_URL?.replace(/\/$/, '');
  if (env) return env;
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}
