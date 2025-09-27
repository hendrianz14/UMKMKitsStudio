import { Router } from 'express';
import axios from 'axios';
import admin from 'firebase-admin';
import { AiJobRequestSchema, AiWebhookSchema } from '../types.js';
import { rateLimit } from '../middlewares/rateLimit.js';
import { CREDIT_COSTS, spendCreditsAtomic } from '../lib/credits.js';
import { getFirestore } from '../lib/firebase-admin.js';

const router = Router();

router.post('/api/ai/jobs', rateLimit, async (req, res) => {
  const parse = AiJobRequestSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'INVALID_PAYLOAD', details: parse.error.flatten() });
  }

  const ownerUid = req.user?.uid;
  if (!ownerUid) {
    return res.status(401).json({ error: 'UNAUTHENTICATED' });
  }

  const firestore = getFirestore();
  if (!firestore) {
    return res.status(500).json({ error: 'FIRESTORE_UNAVAILABLE' });
  }

  const jobRef = firestore.collection('jobs').doc();
  const creditsNeeded = CREDIT_COSTS[parse.data.kind] ?? 1;
  const idempotencyKey = `ai-job-${jobRef.id}`;

  try {
    await spendCreditsAtomic({
      uid: ownerUid,
      amount: creditsNeeded,
      reason: `ai:${parse.data.kind}`,
      idempotencyKey
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
      return res.status(402).json({ error: 'INSUFFICIENT_CREDITS' });
    }
    throw error;
  }

  const jobPayload = {
    ownerUid,
    kind: parse.data.kind,
    input: parse.data.input,
    status: 'queued',
    creditsUsed: creditsNeeded,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await jobRef.set(jobPayload);

  if (!process.env.N8N_BASE_URL || !process.env.N8N_JOB_WEBHOOK_PATH) {
    return res.status(500).json({ error: 'N8N_NOT_CONFIGURED' });
  }

  const callbackUrl = `${process.env.APP_URL ?? process.env.API_BASE_URL ?? ''}/api/ai/webhooks/n8n`;

  await axios.post(`${process.env.N8N_BASE_URL}${process.env.N8N_JOB_WEBHOOK_PATH}`, {
    jobId: jobRef.id,
    ownerUid,
    kind: parse.data.kind,
    input: parse.data.input,
    callbackUrl,
    useUserGeminiKey: parse.data.useUserGeminiKey ?? false
  });

  return res.status(201).json({
    data: {
      jobId: jobRef.id,
      status: 'queued'
    }
  });
});

router.post('/api/ai/webhooks/n8n', async (req, res) => {
  const token = req.header('x-callback-token');
  if (!process.env.N8N_CALLBACK_SECRET || token !== process.env.N8N_CALLBACK_SECRET) {
    return res.status(401).json({ error: 'INVALID_TOKEN' });
  }

  const parse = AiWebhookSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'INVALID_PAYLOAD', details: parse.error.flatten() });
  }

  const firestore = getFirestore();
  if (!firestore) {
    return res.status(500).json({ error: 'FIRESTORE_UNAVAILABLE' });
  }

  const jobRef = firestore.collection('jobs').doc(parse.data.jobId);
  const jobSnap = await jobRef.get();
  if (!jobSnap.exists) {
    return res.status(404).json({ error: 'JOB_NOT_FOUND' });
  }

  const updates: Record<string, unknown> = {
    status: parse.data.status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (parse.data.status === 'succeeded' && parse.data.resultUrl) {
    updates['result'] = {
      url: parse.data.resultUrl,
      meta: parse.data.meta ?? {}
    };
    const assetRef = firestore.collection('assets').doc();
    await assetRef.set({
      ownerUid: jobSnap.get('ownerUid'),
      type: 'image',
      url: parse.data.resultUrl,
      thumb: parse.data.resultUrl,
      bytes: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  if (parse.data.status === 'failed') {
    updates['error'] = parse.data.error ?? 'Unknown error';
  }

  await jobRef.update(updates);

  return res.json({ ok: true });
});

export default router;
