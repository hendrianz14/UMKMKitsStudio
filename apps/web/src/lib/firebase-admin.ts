import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;

function initAdminApp(): App | null {
  if (adminApp) {
    return adminApp;
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error("[firebase-admin] Missing service account credentials");
    return null;
  }

  try {
    adminApp =
      getApps()[0] ??
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    return adminApp;
  } catch (error) {
    console.error("[firebase-admin] Failed to initialize", error);
    return null;
  }
}

export function getFirebaseAdminApp(): App | null {
  return initAdminApp();
}

export function getFirebaseAdminAuth(): Auth | null {
  const app = initAdminApp();
  if (!app) return null;
  return getAuth(app);
}

export function getFirebaseAdminFirestore(): Firestore | null {
  const app = initAdminApp();
  if (!app) return null;
  return getFirestore(app);
}
