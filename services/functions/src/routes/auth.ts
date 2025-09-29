import type { Request } from 'express';
import { Router } from 'express';
import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { getFirestore } from '../lib/firebase-admin.js';
import { assertEmailAllowed, ensureDomainHasMx } from '../utils/email.js';
import { generateOtpCode, getOtpExpiryDate, hashOtp, verifyOtp } from '../utils/otp.js';
import { sendOtpEmail } from '../utils/mailer.js';
import { enforceRateLimit } from '../utils/rateLimit.js';
import { setSessionCookie } from '../utils/session.js';

const router = Router();

const requestSchema = z.object({
  email: z.string().email()
});

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/)
});

function getClientIp(req: Request) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0];
  }
  return req.ip;
}

router.post('/auth/request-otp', async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Email tidak valid' });
  }

  const email = parsed.data.email.toLowerCase();
  const ip = getClientIp(req);

  let domain: string;
  try {
    domain = assertEmailAllowed(email);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  try {
    await ensureDomainHasMx(domain);
  } catch (error) {
    return res.status(400).json({ error: 'Domain email tidak memiliki MX' });
  }

  const rateWindowMs = 60 * 1000;
  const checks = [enforceRateLimit(`otp:email:${email}`, rateWindowMs)];
  if (ip) {
    checks.push(enforceRateLimit(`otp:ip:${ip}`, rateWindowMs));
  }
  const results = await Promise.all(checks);
  const limited = results.find((result) => !result.allowed);
  if (limited) {
    return res.status(429).json({ error: 'Terlalu sering. Coba lagi 1 menit.' });
  }

  const db = getFirestore();
  const collection = db.collection('email_otps');

  const now = new Date();
  const sixtySecondsAgo = new Date(now.getTime() - rateWindowMs);

  const [lastEmail, lastIp] = await Promise.all([
    collection
      .where('email', '==', email)
      .orderBy('created_at', 'desc')
      .limit(1)
      .get(),
    ip
      ? collection
          .where('created_ip', '==', ip)
          .orderBy('created_at', 'desc')
          .limit(1)
          .get()
      : Promise.resolve(null)
  ]);

  const lastEmailDoc = lastEmail.docs[0];
  if (
    lastEmailDoc?.data()?.last_sent_at?.toDate() &&
    lastEmailDoc.data().last_sent_at.toDate() > sixtySecondsAgo
  ) {
    return res.status(429).json({ error: 'Terlalu sering. Coba lagi 1 menit.' });
  }

  const lastIpDoc = lastIp && lastIp.docs[0];
  if (
    ip &&
    lastIpDoc?.data()?.last_sent_at?.toDate() &&
    lastIpDoc.data().last_sent_at.toDate() > sixtySecondsAgo
  ) {
    return res.status(429).json({ error: 'Terlalu sering. Coba lagi 1 menit.' });
  }

  const code = generateOtpCode();
  const hash = await hashOtp(code);
  const expiresAt = getOtpExpiryDate(now);

  await collection.add({
    email,
    code_hash: hash,
    expires_at: Timestamp.fromDate(expiresAt),
    consumed: false,
    attempt_count: 0,
    last_sent_at: Timestamp.fromDate(now),
    created_ip: ip ?? '',
    created_at: Timestamp.fromDate(now)
  });

  try {
    await sendOtpEmail(email, code);
  } catch (error) {
    console.error('Failed to send OTP email', error);
    return res.status(500).json({ error: 'Gagal mengirim email. Coba lagi nanti.' });
  }

  return res.json({ ok: true, message: 'Kode dikirim. Cek inbox/spam untuk kode.' });
});

router.post('/auth/verify-otp', async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Format salah' });
  }

  const email = parsed.data.email.toLowerCase();
  const code = parsed.data.code;

  const db = getFirestore();
  const collection = db.collection('email_otps');
  const now = new Date();

  const snapshot = await collection
    .where('email', '==', email)
    .where('consumed', '==', false)
    .orderBy('created_at', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) {
    return res.status(400).json({ error: 'Kode salah / kadaluarsa.' });
  }

  const doc = snapshot.docs[0];
  const data = doc.data() as {
    code_hash: string;
    expires_at: Timestamp;
    attempt_count: number;
  };

  if (data.attempt_count >= 5) {
    return res.status(429).json({ error: 'Kode salah / kadaluarsa.' });
  }

  const expiresAt = data.expires_at.toDate();
  if (expiresAt <= now) {
    await doc.ref.update({ consumed: true, updated_at: Timestamp.fromDate(now) });
    return res.status(400).json({ error: 'Kode salah / kadaluarsa.' });
  }

  const valid = await verifyOtp(code, data.code_hash);
  if (!valid) {
    const newAttemptCount = data.attempt_count + 1;
    await doc.ref.update({
      attempt_count: newAttemptCount,
      updated_at: Timestamp.fromDate(now)
    });
    const statusCode = newAttemptCount >= 5 ? 429 : 400;
    return res.status(statusCode).json({ error: 'Kode salah / kadaluarsa.' });
  }

  await doc.ref.update({
    consumed: true,
    attempt_count: data.attempt_count,
    verified_at: Timestamp.fromDate(now),
    updated_at: Timestamp.fromDate(now)
  });

  setSessionCookie(res, email);

  return res.json({ ok: true });
});

export default router;
