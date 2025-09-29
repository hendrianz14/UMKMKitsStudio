import "server-only";

import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "./session-constants";

const MIN_SECRET_LENGTH = 32;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error("SESSION_SECRET must be configured and at least 32 characters long.");
  }
  return secret;
}

function shouldUseSecureCookie() {
  const appUrl = process.env.APP_URL ?? "";
  if (!appUrl) {
    return process.env.NODE_ENV === "production";
  }
  return !appUrl.startsWith("http://localhost");
}

function bytesToBase64Url(bytes: Uint8Array) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const base64 = normalized + padding;
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function createSignature(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

function randomNonce(size = 16) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function createSessionToken(email: string) {
  const secret = getSessionSecret();
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = {
    email,
    iat: issuedAt,
    exp: issuedAt + SESSION_MAX_AGE_SECONDS,
    n: randomNonce(),
  };
  const payloadJson = JSON.stringify(payload);
  const encodedPayload = bytesToBase64Url(encoder.encode(payloadJson));
  const signature = await createSignature(secret, payloadJson);
  return `${encodedPayload}.${signature}`;
}

export async function setSessionCookie(headers: Headers, email: string) {
  const token = await createSessionToken(email);
  const attributes = [
    `${SESSION_COOKIE_NAME}=${token}`,
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (shouldUseSecureCookie()) {
    attributes.push("Secure");
  }
  headers.append("Set-Cookie", attributes.join("; "));
}

export function clearSessionCookie(headers: Headers) {
  const attributes = [
    `${SESSION_COOKIE_NAME}=`,
    "Max-Age=0",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (shouldUseSecureCookie()) {
    attributes.push("Secure");
  }
  headers.append("Set-Cookie", attributes.join("; "));
}

export type SessionPayload = {
  email: string;
  iat: number;
  exp: number;
};

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  let payloadJson: string;
  try {
    const payloadBytes = base64UrlToBytes(encodedPayload);
    payloadJson = decoder.decode(payloadBytes);
  } catch {
    return null;
  }

  let expectedSignature: string;
  try {
    const secret = getSessionSecret();
    expectedSignature = await createSignature(secret, payloadJson);
  } catch (error) {
    console.error("[session] Failed to verify session token", error);
    return null;
  }

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const parsed = JSON.parse(payloadJson) as SessionPayload;
    if (!parsed?.email || !parsed?.exp) {
      return null;
    }
    if (parsed.exp * 1000 < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };
