import { randomInt } from "node:crypto";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { DISPOSABLE } from "@/lib/disposable";
import { sendOtpEmail } from "@/lib/mailer";
import { hasMx } from "@/lib/mx";
import { supaAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

const requestSchema = z.object({
  email: z.string().email(),
});

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const OTP_EXPIRY_MS = 10 * 60 * 1000;

function getEmailDomain(email: string): string | null {
  const parts = email.split("@");
  const domain = parts[parts.length - 1];
  return domain ? domain.toLowerCase() : null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Format email salah." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const domain = getEmailDomain(email);

  if (!domain || DISPOSABLE.has(domain)) {
    return NextResponse.json(
      { error: "Gunakan email yang berbeda." },
      { status: 400 }
    );
  }

  const domainHasMx = await hasMx(domain);
  if (!domainHasMx) {
    return NextResponse.json(
      { error: "Domain email tidak valid." },
      { status: 400 }
    );
  }

  const supabase = supaAdmin();
  const { data: rateRows, error: rateError } = await supabase
    .from("email_otps")
    .select("last_sent_at")
    .eq("email", email)
    .order("last_sent_at", { ascending: false })
    .limit(1);

  if (rateError) {
    console.error("[request-otp] Failed to read latest OTP", rateError);
    return NextResponse.json(
      { error: "Gagal memproses permintaan. Coba lagi nanti." },
      { status: 500 }
    );
  }

  const now = Date.now();
  const lastSentAtValue = rateRows?.[0]?.last_sent_at;
  const lastSentAt = lastSentAtValue ? new Date(lastSentAtValue).getTime() : null;

  if (lastSentAt && now - lastSentAt < RATE_LIMIT_WINDOW_MS) {
    return NextResponse.json(
      { error: "Terlalu sering. Coba lagi 1 menit." },
      { status: 429 }
    );
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const codeHash = await bcrypt.hash(code, 10);
  const issuedAt = new Date(now);
  const expiresAt = new Date(now + OTP_EXPIRY_MS);

  const { data: insertedRows, error: insertError } = await supabase
    .from("email_otps")
    .insert({
      email,
      code_hash: codeHash,
      expires_at: expiresAt.toISOString(),
      consumed: false,
      attempt_count: 0,
      last_sent_at: issuedAt.toISOString(),
      created_at: issuedAt.toISOString(),
    })
    .select("id");

  if (insertError) {
    console.error("[request-otp] Failed to store OTP", insertError);
    return NextResponse.json(
      { error: "Gagal memproses permintaan. Coba lagi nanti." },
      { status: 500 }
    );
  }

  const insertedId = insertedRows?.[0]?.id as string | number | undefined;

  try {
    await sendOtpEmail(email, code);
  } catch (error) {
    if (insertedId !== undefined) {
      await supabase.from("email_otps").delete().eq("id", insertedId);
    }
    console.error("[request-otp] Failed to send OTP email", error);
    return NextResponse.json(
      { error: "Gagal mengirim email. Coba lagi nanti." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
