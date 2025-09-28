import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  type Auth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// 🔒 Baca ENV secara STATIS (agar Next inline ke bundle client)
const ENV = {
  API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // harus <project>.appspot.com
  APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // opsional
} as const;

function missingEnvKeys() {
  return Object.entries({
    NEXT_PUBLIC_FIREBASE_API_KEY: ENV.API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ENV.AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: ENV.PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ENV.STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_APP_ID: ENV.APP_ID,
  })
    .filter(([, v]) => !v)
    .map(([k]) => k);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let firestore: Firestore | null = null;
let analyticsPromise: Promise<Analytics | null> | null = null;
let persistencePromise: Promise<void> | null = null;
let persistenceApplied = false;

function ensureApp(): FirebaseApp | null {
  const missing = missingEnvKeys();
  if (missing.length) {
    console.error("[firebase-client] Missing ENV (client bundle):", missing.join(", "));
    return null;
  }

  if (!app) {
    const cfg = {
      apiKey: ENV.API_KEY!,
      authDomain: ENV.AUTH_DOMAIN!,
      projectId: ENV.PROJECT_ID!,
      storageBucket: ENV.STORAGE_BUCKET!,
      appId: ENV.APP_ID!,
      measurementId: ENV.MEASUREMENT_ID,
    };

    if (!getApps().length) {
      app = initializeApp(cfg);
    } else {
      app = getApps()[0] ?? null;
    }

    if (app) {
      auth ??= getAuth(app);
      if (typeof window !== "undefined" && auth && !persistenceApplied) {
        persistencePromise ??= setPersistence(auth, browserLocalPersistence)
          .catch((error) => {
            if (process.env.NODE_ENV !== "production") {
              console.warn("[firebase-client] Gagal mengatur persistence", error);
            }
          })
          .finally(() => {
            persistenceApplied = true;
          });
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
    if (typeof window !== "undefined" && !persistenceApplied) {
      persistencePromise ??= setPersistence(auth, browserLocalPersistence)
        .catch((error) => {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[firebase-client] Gagal mengatur persistence", error);
          }
        })
        .finally(() => {
          persistenceApplied = true;
        });
    }
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
