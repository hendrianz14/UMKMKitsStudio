import crypto from 'node:crypto';
import type { Response } from 'express';

const SESSION_COOKIE_NAME = 'umkm_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type SessionPayload = {
  email: string;
  verified: boolean;
  exp: number;
  iat: number;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be provided and at least 32 characters long.');
  }
  return secret;
}

export function createSessionToken(payload: Omit<SessionPayload, 'iat' | 'exp'>) {
  const now = Date.now();
  const session: SessionPayload = {
    ...payload,
    iat: Math.floor(now / 1000),
    exp: Math.floor((now + SESSION_TTL_MS) / 1000)
  };
  const json = JSON.stringify(session);
  const signature = crypto.createHmac('sha256', getSecret()).update(json).digest('base64url');
  const encoded = Buffer.from(json).toString('base64url');
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string) {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  const json = Buffer.from(encoded, 'base64url').toString('utf8');
  const expected = crypto.createHmac('sha256', getSecret()).update(json).digest('base64url');
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }
  const payload = JSON.parse(json) as SessionPayload;
  if (payload.exp * 1000 < Date.now()) {
    return null;
  }
  return payload;
}

export function setSessionCookie(res: Response, email: string) {
  const token = createSessionToken({ email, verified: true });
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS,
    path: '/'
  });
}

export { SESSION_COOKIE_NAME };
