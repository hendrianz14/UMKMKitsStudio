import { NextResponse } from 'next/server';

const REQUIRED_ENV = {
  API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

export function GET() {
  const flags = {
    API_KEY: Boolean(REQUIRED_ENV.API_KEY),
    AUTH_DOMAIN: Boolean(REQUIRED_ENV.AUTH_DOMAIN),
    PROJECT_ID: Boolean(REQUIRED_ENV.PROJECT_ID),
    STORAGE_BUCKET: Boolean(REQUIRED_ENV.STORAGE_BUCKET),
    APP_ID: Boolean(REQUIRED_ENV.APP_ID),
  } as const;

  const missing = Object.entries(flags)
    .filter(([, isPresent]) => !isPresent)
    .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key}`);

  return NextResponse.json({
    ok: missing.length === 0,
    flags,
    missing,
  });
}
