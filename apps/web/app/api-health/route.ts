import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    status: 'ok',
    time: new Date().toISOString(),
    env: {
      hasApiBase: Boolean(process.env.NEXT_PUBLIC_API_BASE),
      nodeEnv: process.env.NODE_ENV
    }
  });
}
