import admin from "firebase-admin";

let adminApp: admin.app.App | null = null;

function initAdminApp(): admin.app.App | null {
  if (adminApp) {
    return adminApp;
  }

  if (admin.apps.length) {
    adminApp = admin.app();
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
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    return adminApp;
  } catch (error) {
    console.error("[firebase-admin] Failed to initialize", error);
    return null;
  }
}

export function getFirebaseAdminApp(): admin.app.App | null {
  return initAdminApp();
}

export function getFirebaseAdminAuth(): admin.auth.Auth | null {
  const app = initAdminApp();
  if (!app) return null;
  return admin.auth(app);
}

export function getFirebaseAdminFirestore(): admin.firestore.Firestore | null {
  const app = initAdminApp();
  if (!app) return null;
  return admin.firestore(app);
}
