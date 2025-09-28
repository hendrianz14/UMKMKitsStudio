import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    ok: true,
    flags: {
      API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      AUTH_DOMAIN: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      STORAGE_BUCKET: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      APP_ID: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      MEASUREMENT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // opsional
    },
    // hint tidak mengandung nilai rahasia
    hints: {
      storageBucketShouldEndWith: '.appspot.com',
      commonMistake: 'Jangan pakai URL firebasestorage…; gunakan <project-id>.appspot.com'
    }
  });
}
