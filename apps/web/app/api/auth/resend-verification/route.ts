import crypto from "node:crypto";

import { NextResponse } from "next/server";
import { supaAdmin } from "@/lib/supabase-server";
import { isValidEmailFormat, normalizeEmail } from "@/lib/email";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function getRetryAfterMinutes(lastSentMs: number, nowMs: number) {
  const diff = RATE_LIMIT_WINDOW_MS - (nowMs - lastSentMs);
  return Math.max(1, Math.ceil(diff / (1000 * 60)));
}

function extractMillis(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === "number") {
    return value;
  }
  const date = new Date(value as string);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
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

  let supabase: ReturnType<typeof supaAdmin>;
  try {
    supabase = supaAdmin();
  } catch (error) {
    console.error("[resend-verification] Failed to initialize Supabase admin", error);
    return NextResponse.json(
      { message: "Layanan sedang tidak tersedia. Coba lagi nanti." },
      { status: 500 }
    );
  }
  const baseUrl =
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;

  const emailHash = crypto.createHash("sha256").update(normalizedEmail).digest("hex");
  const now = Date.now();
  try {
    const { data, error: fetchError } = await supabase
      .from("verification_resends")
      .select("last_sent, created_at")
      .eq("email_hash", emailHash)
      .maybeSingle();

    if (fetchError && fetchError.code !== "42P01") {
      console.error("[resend-verification] Failed to read rate limit", fetchError);
      return NextResponse.json(
        { message: "Gagal memproses permintaan. Coba lagi nanti." },
        { status: 500 }
      );
    }

    const lastSentMs = extractMillis(data?.last_sent);

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
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
      options: {
        emailRedirectTo: actionUrl,
      },
    });

    if (resendError) {
      const status = (resendError as { status?: number }).status ?? 500;
      if (status === 400 || status === 404) {
        // Hide account existence
      } else {
        console.error("[resend-verification] resend failed", resendError);
        return NextResponse.json(
          { message: "Gagal memproses permintaan. Coba lagi nanti." },
          { status: 500 }
        );
      }
    }

    try {
      await supabase.from("verification_resends").upsert(
        {
          email_hash: emailHash,
          created_at: data?.created_at ?? new Date(now).toISOString(),
          last_sent: new Date(now).toISOString(),
          updated_at: new Date(now).toISOString(),
        },
        { onConflict: "email_hash" }
      );
    } catch (upsertError) {
      if ((upsertError as { code?: string })?.code !== "42P01") {
        console.warn("[resend-verification] Failed to persist rate limit", upsertError);
      }
    }

    return NextResponse.json({ message: "Jika email terdaftar, tautan verifikasi dikirim." });
  } catch (error) {
    console.error("[resend-verification] Unexpected error", error);
    return NextResponse.json(
      { message: "Gagal memproses permintaan. Coba lagi nanti." },
      { status: 500 }
    );
  }
}
