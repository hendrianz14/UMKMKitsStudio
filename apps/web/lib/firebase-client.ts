import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let firestore: Firestore | null = null;
let analyticsPromise: Promise<Analytics | null> | null = null;

const requiredEnv = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
] as const;

function hasEnv() {
  return requiredEnv.every((key) => Boolean(process.env[key]));
}

function ensureApp(): FirebaseApp | null {
  if (!hasEnv()) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[firebase-client] Firebase environment variables belum lengkap; inisialisasi dilewati.');
    }
    return null;
  }

  if (!app) {
    app = initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    });
  }

  return app;
}

export function getClientApp(): FirebaseApp | null {
  return ensureApp();
}

export function getFirebaseAuth(): Auth | null {
  const firebaseApp = ensureApp();
  if (!firebaseApp) return null;
  if (!auth) {
    auth = getAuth(firebaseApp);
  }
  return auth;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  const firebaseApp = ensureApp();
  if (!firebaseApp) return null;
  if (!storage) {
    storage = getStorage(firebaseApp);
  }
  return storage;
}

export function getFirebaseFirestore(): Firestore | null {
  const firebaseApp = ensureApp();
  if (!firebaseApp) return null;
  if (!firestore) {
    firestore = getFirestore(firebaseApp);
  }
  return firestore;
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  const firebaseApp = ensureApp();
  if (!firebaseApp) return null;
  if (!analyticsPromise) {
    analyticsPromise = isSupported()
      .then((supported) => (supported ? getAnalytics(firebaseApp) : null))
      .catch((err) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[firebase-client] Analytics tidak tersedia', err);
        }
        return null;
      });
  }
  return analyticsPromise;
}
