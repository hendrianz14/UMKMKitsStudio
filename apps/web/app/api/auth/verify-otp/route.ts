import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { supaAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const code = parsed.data.code.trim();

  const supabase = supaAdmin();
  const nowIso = new Date().toISOString();

  const { data: otpRows, error: fetchError } = await supabase
    .from("email_otps")
    .select("id, code_hash, attempt_count, expires_at")
    .eq("email", email)
    .eq("consumed", false)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error("[verify-otp] Failed to read OTP", fetchError);
    return NextResponse.json(
      { error: "Gagal memproses permintaan. Coba lagi nanti." },
      { status: 500 }
    );
  }

  const otp = otpRows?.[0];

  if (!otp) {
    return NextResponse.json(
      { error: "Kode OTP tidak ditemukan atau sudah kadaluarsa." },
      { status: 400 }
    );
  }

  if ((otp.attempt_count ?? 0) >= 5) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi nanti." },
      { status: 429 }
    );
  }

  const isValid = await bcrypt.compare(code, otp.code_hash ?? "");

  if (!isValid) {
    const nextAttemptCount = (otp.attempt_count ?? 0) + 1;

    const { error: updateError } = await supabase
      .from("email_otps")
      .update({ attempt_count: nextAttemptCount })
      .eq("id", otp.id);

    if (updateError) {
      console.error("[verify-otp] Failed to increment attempt_count", updateError);
      return NextResponse.json(
        { error: "Gagal memproses permintaan. Coba lagi nanti." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Kode OTP salah." },
      { status: 400 }
    );
  }

  const { error: consumeError } = await supabase
    .from("email_otps")
    .update({ consumed: true })
    .eq("id", otp.id);

  if (consumeError) {
    console.error("[verify-otp] Failed to mark OTP as consumed", consumeError);
    return NextResponse.json(
      { error: "Gagal memproses permintaan. Coba lagi nanti." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
