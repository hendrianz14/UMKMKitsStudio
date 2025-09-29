import { NextResponse } from 'next/server';

const REQUIRED_ENV = {
  URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const;

export function GET() {
  const flags = {
    URL: Boolean(REQUIRED_ENV.URL),
    ANON_KEY: Boolean(REQUIRED_ENV.ANON_KEY),
  } as const;

  const missing = Object.entries(flags)
    .filter(([, isPresent]) => !isPresent)
    .map(([key]) => `NEXT_PUBLIC_SUPABASE_${key}`);

  return NextResponse.json({
    ok: missing.length === 0,
    flags,
    missing,
  });
}
