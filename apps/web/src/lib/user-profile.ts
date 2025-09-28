import { type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase-client";

export interface UserDoc {
  email: string;
  name?: string | null;
  createdAt: ReturnType<typeof serverTimestamp>;
  credits: number;
  onboardingCompleted: boolean;
  onboarding?: Record<string, unknown>;
}

export async function ensureUserDoc(user: User, extra?: Partial<UserDoc>) {
  const firestore = getFirebaseFirestore();
  if (!firestore) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[user-profile] Firestore tidak tersedia di client");
    }
    return;
  }

  const ref = doc(firestore, "users", user.uid);
  const snapshot = await getDoc(ref);

  const basePayload: Partial<UserDoc> = {
    email: user.email ?? extra?.email ?? "",
    name: extra?.name ?? user.displayName ?? null,
    credits: 50,
    onboardingCompleted: false,
  };

  if (!snapshot.exists()) {
    await setDoc(
      ref,
      {
        ...basePayload,
        ...extra,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
    return;
  }

  const dataToMerge: Partial<UserDoc> = {
    email: user.email ?? snapshot.data()?.email ?? "",
  };

  if (basePayload.name) {
    dataToMerge.name = basePayload.name;
  }

  if (extra) {
    Object.assign(dataToMerge, extra);
  }

  const existing = snapshot.data() as Partial<UserDoc> | undefined;
  if (existing?.credits == null) {
    dataToMerge.credits = basePayload.credits;
  }
  if (existing?.onboardingCompleted == null) {
    dataToMerge.onboardingCompleted = basePayload.onboardingCompleted;
  }

  await setDoc(ref, dataToMerge, { merge: true });
}
