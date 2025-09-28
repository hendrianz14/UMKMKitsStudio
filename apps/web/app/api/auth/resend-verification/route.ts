import crypto from "node:crypto";

import { NextResponse } from "next/server";
import { getFirebaseAdminFirestore } from "@/lib/firebase-admin";
import { isValidEmailFormat, normalizeEmail } from "@/lib/email";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function getRetryAfterMinutes(lastSentMs: number, nowMs: number) {
  const diff = RATE_LIMIT_WINDOW_MS - (nowMs - lastSentMs);
  return Math.max(1, Math.ceil(diff / (1000 * 60)));
}

function extractMillis(value: unknown): number | null {
  if (typeof value === "number") {
    return value;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (
    value &&
    typeof value === "object" &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    try {
      return (value as { toMillis: () => number }).toMillis();
    } catch (error) {
      console.warn("[resend-verification] Failed to read Firestore timestamp", error);
      return null;
    }
  }
  return null;
}

export async function POST(request: Request) {
  let emailInput = "";

  try {
    const body = await request.json().catch(() => null);
    emailInput = typeof body?.email === "string" ? body.email : "";
  } catch (error) {
    console.error("[resend-verification] Failed to parse body", error);
    return NextResponse.json({ message: "Jika email terdaftar, tautan verifikasi dikirim." });
  }

  const normalizedEmail = normalizeEmail(emailInput);
  if (!isValidEmailFormat(normalizedEmail)) {
    return NextResponse.json({ message: "Jika email terdaftar, tautan verifikasi dikirim." });
  }

  const firestore = getFirebaseAdminFirestore();
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const baseUrl =
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;

  if (!firestore || !apiKey) {
    console.error("[resend-verification] Missing Firebase configuration");
    return NextResponse.json(
      { message: "Layanan sedang tidak tersedia. Coba lagi nanti." },
      { status: 500 }
    );
  }

  const emailHash = crypto.createHash("sha256").update(normalizedEmail).digest("hex");
  const docRef = firestore.collection("verification_resends").doc(emailHash);
  const now = Date.now();
  try {
    const snapshot = await docRef.get();
    const data = snapshot.exists ? snapshot.data() : null;
    const lastSentValue = data?.lastSent;
    const lastSentMs = extractMillis(lastSentValue);

    if (lastSentMs && now - lastSentMs < RATE_LIMIT_WINDOW_MS) {
      const retryAfterMinutes = getRetryAfterMinutes(lastSentMs, now);
      return NextResponse.json(
        { retryAfterMinutes },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterMinutes * 60) },
        }
      );
    }

    const actionUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/auth/action` : undefined;
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "VERIFY_EMAIL",
          email: normalizedEmail,
          continueUrl: actionUrl,
          canHandleCodeInApp: false,
        }),
      }
    );

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      const message = errorPayload?.error?.message;

      if (message === "EMAIL_NOT_FOUND" || message === "USER_DISABLED") {
        // Hide account existence
      } else {
        console.error("[resend-verification] sendOobCode failed", message ?? response.statusText);
        return NextResponse.json(
          { message: "Gagal memproses permintaan. Coba lagi nanti." },
          { status: 500 }
        );
      }
    }

    await docRef.set(
      {
        createdAt: data?.createdAt ?? new Date(now),
        lastSent: new Date(now),
        updatedAt: new Date(now),
      },
      { merge: true }
    );

    return NextResponse.json({ message: "Jika email terdaftar, tautan verifikasi dikirim." });
  } catch (error) {
    console.error("[resend-verification] Unexpected error", error);
    return NextResponse.json(
      { message: "Gagal memproses permintaan. Coba lagi nanti." },
      { status: 500 }
    );
  }
}
