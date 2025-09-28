import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const required = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

function missingEnv() {
  return required.filter((key) => !process.env[key]);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let firestore: Firestore | null = null;
let analyticsPromise: Promise<Analytics | null> | null = null;

function ensureApp(): FirebaseApp | null {
  const miss = missingEnv();
  if (miss.length) {
    console.error("[firebase-client] Missing ENV (client bundle):", miss.join(", "));
    return null;
  }

  if (!app) {
    const cfg = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    if (!getApps().length) {
      app = initializeApp(cfg);
    } else {
      app = getApps()[0] ?? null;
    }

    if (app && typeof window !== "undefined") {
      try {
        const firebaseAuth = getAuth(app);
        auth ??= firebaseAuth;
        void setPersistence(firebaseAuth, browserLocalPersistence);
      } catch {
        // no-op: persistence setting is best-effort
      }
    }
  }

  return app;
}

export function getClientApp() {
  return ensureApp();
}

export function getFirebaseAuth() {
  const clientApp = ensureApp();
  if (!clientApp) return null;
  if (!auth) {
    auth = getAuth(clientApp);
  }
  return auth;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  const clientApp = ensureApp();
  if (!clientApp) return null;
  if (!storage) {
    storage = getStorage(clientApp);
  }
  return storage;
}

export function getFirebaseFirestore(): Firestore | null {
  const clientApp = ensureApp();
  if (!clientApp) return null;
  if (!firestore) {
    firestore = getFirestore(clientApp);
  }
  return firestore;
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  const clientApp = ensureApp();
  if (!clientApp) return null;
  if (!analyticsPromise) {
    analyticsPromise = isSupported()
      .then((supported) => (supported ? getAnalytics(clientApp) : null))
      .catch((err) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[firebase-client] Analytics tidak tersedia", err);
        }
        return null;
      });
  }
  return analyticsPromise;
}
