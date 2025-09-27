import admin from 'firebase-admin';

type FirebaseServices = {
  app: admin.app.App | null;
  firestore: admin.firestore.Firestore | null;
};

const firebaseServices: FirebaseServices = {
  app: null,
  firestore: null
};

function buildCredentials() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase admin credentials are missing.');
  }

  return {
    projectId,
    clientEmail,
    privateKey
  };
}

export function getAdminApp() {
  if (firebaseServices.app) return firebaseServices.app;

  try {
    const credential = admin.credential.cert(buildCredentials());
    firebaseServices.app = admin.apps.length
      ? admin.app()
      : admin.initializeApp({ credential });
    firebaseServices.firestore = admin.firestore(firebaseServices.app);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[firebase-admin] gagal inisialisasi admin', error);
    }
    throw error;
  }

  return firebaseServices.app;
}

export function getFirestore() {
  if (!firebaseServices.firestore) {
    getAdminApp();
  }
  return firebaseServices.firestore;
}

export function getAuth() {
  const app = getAdminApp();
  return admin.auth(app);
}
