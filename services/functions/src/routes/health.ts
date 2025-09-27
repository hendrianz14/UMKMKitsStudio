import { Router } from 'express';
import { getFirestore } from '../lib/firebase-admin.js';

const router = Router();

router.get('/api-health', (_req, res) => {
  let firestoreReady = false;
  try {
    firestoreReady = Boolean(getFirestore());
  } catch (error) {
    firestoreReady = false;
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    firestoreReady,
    env: {
      midtrans: Boolean(process.env.MIDTRANS_SERVER_KEY),
      n8n: Boolean(process.env.N8N_BASE_URL)
    }
  });
});

export default router;
