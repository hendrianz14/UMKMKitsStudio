import crypto from "node:crypto";

import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminFirestore } from "@/lib/firebase-admin";
import { isValidEmailFormat, normalizeEmail } from "@/lib/email";

const RATE_LIMIT_WINDOW_MS = 1000 * 60 * 60 * 3; // 3 hours

function getRetryAfterMinutes(lastSentMs: number, nowMs: number) {
  const diff = RATE_LIMIT_WINDOW_MS - (nowMs - lastSentMs);
  return Math.max(1, Math.ceil(diff / (1000 * 60)));
}

export async function POST(request: Request) {
  const defaultMessage = "Jika email terdaftar, kami kirim tautan reset.";

  let emailInput = "";
  try {
    const body = await request.json().catch(() => null);
    emailInput = typeof body?.email === "string" ? body.email : "";
  } catch (error) {
    console.error("[password-reset] Failed to parse body", error);
    return NextResponse.json({ message: defaultMessage });
  }

  const normalizedEmail = normalizeEmail(emailInput);
  if (!isValidEmailFormat(normalizedEmail)) {
    return NextResponse.json({ message: defaultMessage });
  }

  const firestore = getFirebaseAdminFirestore();
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const baseUrl =
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;

  if (!firestore || !apiKey) {
    console.error("[password-reset] Missing Firebase configuration");
    return NextResponse.json(
      { message: "Layanan sedang tidak tersedia. Coba lagi nanti." },
      { status: 500 }
    );
  }

  const emailHash = crypto.createHash("sha256").update(normalizedEmail).digest("hex");
  const docRef = firestore.collection("password_resets").doc(emailHash);
  const now = Date.now();
  const nowTimestamp = Timestamp.fromMillis(now);

  try {
    const snapshot = await docRef.get();
    const data = snapshot.exists ? snapshot.data() : null;
    const lastSentValue = data?.lastSent;
    const lastSentMs =
      typeof lastSentValue === "number"
        ? lastSentValue
        : lastSentValue instanceof Timestamp
          ? lastSentValue.toMillis()
          : null;

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
          requestType: "PASSWORD_RESET",
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
        // We intentionally respond with success to avoid leaking account existence.
      } else {
        console.error("[password-reset] sendOobCode failed", message ?? response.statusText);
        return NextResponse.json(
          { message: "Gagal memproses permintaan. Coba lagi nanti." },
          { status: 500 }
        );
      }
    }

    const createdAtValue =
      data?.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromMillis(now);
    await docRef.set(
      {
        createdAt: createdAtValue,
        lastSent: nowTimestamp,
        updatedAt: nowTimestamp,
      },
      { merge: true }
    );

    return NextResponse.json({ message: defaultMessage });
  } catch (error) {
    console.error("[password-reset] Unexpected error", error);
    return NextResponse.json(
      { message: "Gagal memproses permintaan. Coba lagi nanti." },
      { status: 500 }
    );
  }
}
