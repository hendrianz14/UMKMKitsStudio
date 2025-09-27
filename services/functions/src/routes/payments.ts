import { Router } from 'express';
import admin from 'firebase-admin';
import { PaymentCreateSchema, PaymentWebhookSchema } from '../types.js';
import { createSnap, verifySignature } from '../lib/midtrans.js';
import { getFirestore } from '../lib/firebase-admin.js';

const router = Router();

router.post('/api/payments/create', async (req, res) => {
  const parse = PaymentCreateSchema.safeParse(req.body);
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

  const orderId = `order-${ownerUid}-${Date.now()}`;
  const transactionRef = firestore.collection('transactions').doc(orderId);

  const transaction = await createSnap({
    orderId,
    amount: parse.data.amount,
    customer: {
      firstName: req.user?.email ?? 'Member',
      email: req.user?.email ?? 'member@example.com'
    },
    itemDetails: [
      {
        id: parse.data.type,
        name: `${parse.data.type} credits`,
        price: parse.data.amount,
        quantity: 1
      }
    ]
  });

  await transactionRef.set({
    ownerUid,
    orderId,
    amount: parse.data.amount,
    currency: 'IDR',
    status: 'pending',
    provider: 'midtrans',
    payload: transaction,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return res.status(201).json({ data: transaction });
});

router.post('/api/payments/webhook', async (req, res) => {
  const parse = PaymentWebhookSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'INVALID_PAYLOAD', details: parse.error.flatten() });
  }

  if (!verifySignature(parse.data)) {
    return res.status(401).json({ error: 'INVALID_SIGNATURE' });
  }

  const firestore = getFirestore();
  if (!firestore) {
    return res.status(500).json({ error: 'FIRESTORE_UNAVAILABLE' });
  }

  const transactionRef = firestore.collection('transactions').doc(parse.data.order_id);
  const transactionSnap = await transactionRef.get();
  if (!transactionSnap.exists) {
    await transactionRef.set({
      ownerUid: null,
      orderId: parse.data.order_id,
      amount: Number(parse.data.gross_amount),
      currency: 'IDR',
      status: parse.data.transaction_status,
      provider: 'midtrans',
      payload: parse.data,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return res.json({ ok: true, message: 'Transaction stub created' });
  }

  const ownerUid = transactionSnap.get('ownerUid');

  await transactionRef.update({
    status: parse.data.transaction_status,
    payload: parse.data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  if (parse.data.transaction_status === 'settlement' && ownerUid) {
    const firestoreInstance = getFirestore();
    if (firestoreInstance) {
      await firestoreInstance.runTransaction(async (tx) => {
        const userRef = firestoreInstance.collection('users').doc(ownerUid);
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists) return;
        const credits = userSnap.get('credits') ?? 0;
        tx.update(userRef, {
          credits: credits + Number(parse.data.gross_amount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
    }
  }

  return res.json({ ok: true });
});

export default router;
