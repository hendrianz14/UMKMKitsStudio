import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

import { setSessionCookie } from "lib/session";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  code: z.string().regex(/^\d{6}$/, "Kode harus 6 digit"),
});

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

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Input tidak valid" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const code = parsed.data.code.trim();

  let supabase;
  try {
    supabase = getSupabase();
  } catch (error) {
    console.error("[verify-otp] Supabase not configured", error);
    return NextResponse.json({ ok: false, error: "Konfigurasi server belum lengkap" }, { status: 500 });
  }

  const { data: otp, error: fetchError } = await supabase
    .from("email_otps")
    .select("id, code_hash, expires_at, attempt_count")
    .eq("email", email)
    .eq("consumed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error("[verify-otp] Failed to fetch OTP", fetchError);
    return NextResponse.json({ ok: false, error: "Gagal memproses kode" }, { status: 500 });
  }

  if (!otp) {
    return NextResponse.json({ ok: false, error: "Kode tidak ditemukan" }, { status: 400 });
  }

  if (otp.attempt_count >= 5) {
    return NextResponse.json({ ok: false, error: "OTP terkunci. Minta kode baru." }, { status: 429 });
  }

  const expiresAt = new Date(otp.expires_at).getTime();
  if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
    return NextResponse.json({ ok: false, error: "Kode telah kadaluarsa" }, { status: 400 });
  }

  const isValid = await bcrypt.compare(code, otp.code_hash);

  if (!isValid) {
    const { error: updateError } = await supabase
      .from("email_otps")
      .update({ attempt_count: otp.attempt_count + 1 })
      .eq("id", otp.id);

    if (updateError) {
      console.error("[verify-otp] Failed to update attempts", updateError);
    }

    return NextResponse.json({ ok: false, error: "Kode salah" }, { status: 400 });
  }

  const { error: consumeError } = await supabase
    .from("email_otps")
    .update({ consumed: true, attempt_count: otp.attempt_count })
    .eq("id", otp.id);

  if (consumeError) {
    console.error("[verify-otp] Failed to mark OTP consumed", consumeError);
    return NextResponse.json({ ok: false, error: "Gagal menyelesaikan verifikasi" }, { status: 500 });
  }

  const headers = new Headers();
  try {
    await setSessionCookie(headers, email);
  } catch (error) {
    console.error("[verify-otp] Failed to set session cookie", error);
    return NextResponse.json({ ok: false, error: "Konfigurasi sesi belum siap" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { headers });
}
