import { Timestamp } from 'firebase-admin/firestore';
import { getFirestore } from '../lib/firebase-admin.js';

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds?: number;
};

const memoryStore = new Map<string, number>();

export async function enforceRateLimit(key: string, windowMs: number): Promise<RateLimitResult> {
  const now = Date.now();

  if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
    const last = memoryStore.get(key) ?? 0;
    if (last + windowMs > now) {
      return { allowed: false, retryAfterSeconds: Math.ceil((last + windowMs - now) / 1000) };
    }
    memoryStore.set(key, now);
    return { allowed: true };
  }

  const db = getFirestore();
  const docRef = db.collection('rate_limits').doc(key);
  const snapshot = await docRef.get();

  if (snapshot.exists) {
    const data = snapshot.data() as { reset_at?: Timestamp } | undefined;
    const resetAt = data?.reset_at?.toDate().getTime() ?? 0;
    if (resetAt > now) {
      return { allowed: false, retryAfterSeconds: Math.ceil((resetAt - now) / 1000) };
    }
  }

  await docRef.set({
    reset_at: Timestamp.fromMillis(now + windowMs),
    updated_at: Timestamp.now()
  });

  return { allowed: true };
}
