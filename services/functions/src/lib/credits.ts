import admin from 'firebase-admin';
import { getFirestore } from './firebase-admin.js';

export interface SpendCreditsInput {
  uid: string;
  amount: number;
  reason: string;
  idempotencyKey: string;
}

export interface SpendCreditsResult {
  success: boolean;
  remainingCredits: number;
}

export const CREDIT_COSTS: Record<string, number> = {
  caption: 1,
  img_enhance: 5,
  img2img: 10,
  img2video: 30
};

export async function spendCreditsAtomic({ uid, amount, reason, idempotencyKey }: SpendCreditsInput): Promise<SpendCreditsResult> {
  const firestore = getFirestore();
  if (!firestore) {
    throw new Error('Firestore not initialised');
  }

  return firestore.runTransaction(async (transaction) => {
    const userRef = firestore.collection('users').doc(uid);
    const logRef = userRef.collection('credit_logs').doc(idempotencyKey);

    const [userSnap, logSnap] = await Promise.all([transaction.get(userRef), transaction.get(logRef)]);

    if (!userSnap.exists) {
      throw new Error('USER_NOT_FOUND');
    }

    if (logSnap.exists) {
      const userData = userSnap.data() as { credits?: number };
      return {
        success: true,
        remainingCredits: userData.credits ?? 0
      };
    }

    const userData = userSnap.data() as { credits?: number };
    const currentCredits = userData.credits ?? 0;

    if (currentCredits < amount) {
      throw new Error('INSUFFICIENT_CREDITS');
    }

    transaction.update(userRef, {
      credits: currentCredits - amount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    transaction.set(logRef, {
      amount,
      reason,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      remainingCredits: currentCredits - amount
    };
  });
}
