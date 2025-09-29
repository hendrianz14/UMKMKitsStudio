import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

import { DISPOSABLE } from "lib/disposable";
import { hasMx } from "lib/mx";
import { sendOtpEmail } from "lib/mailer";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
});

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const OTP_EXPIRY_MINUTES = 10;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase environment variables are missing");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return request.headers.get("x-real-ip");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Format email tidak valid" }, { status: 400 });
  }

  const rawEmail = parsed.data.email.trim().toLowerCase();
  const domain = rawEmail.split("@")[1];
  if (!domain) {
    return NextResponse.json({ ok: false, error: "Email tidak valid" }, { status: 400 });
  }

  if (DISPOSABLE.has(domain)) {
    return NextResponse.json({ ok: false, error: "Email disposable tidak diizinkan" }, { status: 400 });
  }

  const hasValidMx = await hasMx(domain);
  if (!hasValidMx) {
    return NextResponse.json({ ok: false, error: "Domain email tidak memiliki MX record" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabase();
  } catch (error) {
    console.error("[request-otp] Supabase not configured", error);
    return NextResponse.json({ ok: false, error: "Konfigurasi server belum lengkap" }, { status: 500 });
  }

  const { data: latestOtp, error: fetchError } = await supabase
    .from("email_otps")
    .select("id,last_sent_at")
    .eq("email", rawEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error("[request-otp] Failed to fetch latest OTP", fetchError);
    return NextResponse.json({ ok: false, error: "Gagal memproses permintaan" }, { status: 500 });
  }

  if (latestOtp?.last_sent_at) {
    const lastSent = new Date(latestOtp.last_sent_at).getTime();
    if (!Number.isNaN(lastSent) && Date.now() - lastSent < RATE_LIMIT_WINDOW_MS) {
      return NextResponse.json({ ok: false, error: "Terlalu sering meminta kode" }, { status: 429 });
    }
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 12);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  const insertPayload = {
    email: rawEmail,
    code_hash: codeHash,
    expires_at: expiresAt,
    consumed: false,
    attempt_count: 0,
    last_sent_at: new Date().toISOString(),
    created_ip: getClientIp(request),
  };

  const { error: insertError } = await supabase.from("email_otps").insert(insertPayload);

  if (insertError) {
    console.error("[request-otp] Failed to save OTP", insertError);
    return NextResponse.json({ ok: false, error: "Gagal menyimpan kode" }, { status: 500 });
  }

  try {
    await sendOtpEmail(rawEmail, code);
  } catch (error) {
    console.error("[request-otp] Failed to send OTP email", error);
    return NextResponse.json({ ok: false, error: "Gagal mengirim email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
