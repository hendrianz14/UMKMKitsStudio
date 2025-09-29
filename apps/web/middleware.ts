import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "umkm_session";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "";
const SESSION_MIN_LENGTH = 32;

function base64UrlToUint8Array(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const decoded = atob(normalized + padding);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i += 1) {
    bytes[i] = decoded.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signPayload(payload: string) {
  if (!SESSION_SECRET || SESSION_SECRET.length < SESSION_MIN_LENGTH) return null;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return uint8ArrayToBase64Url(new Uint8Array(signature));
}

async function verifySession(token: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  const payloadBytes = base64UrlToUint8Array(encodedPayload);
  const payloadJson = new TextDecoder().decode(payloadBytes);
  const expectedSignature = await signPayload(payloadJson);
  if (!expectedSignature || expectedSignature !== signature) {
    return null;
  }
  try {
    const payload = JSON.parse(payloadJson) as { verified?: boolean; exp?: number };
    if (!payload.exp || payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function isProtectedPath(pathname: string) {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/app");
}

function isAuthPath(pathname: string) {
  return pathname.startsWith("/login") || pathname.startsWith("/otp");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionToken ? await verifySession(sessionToken) : null;

  if (isProtectedPath(pathname)) {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    if (!session.verified) {
      const url = request.nextUrl.clone();
      url.pathname = "/verify-email";
      return NextResponse.redirect(url);
    }
  }

  if (session && isAuthPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/app/:path*", "/login", "/otp"]
};
