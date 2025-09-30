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
function requireEnv(keys: string[]) {
  const miss = keys.filter((k) => !process.env[k] || String(process.env[k]).trim() === "");
  return miss;
}

async function findUserByEmail(admin: ReturnType<typeof supaAdmin>, email: string) {
  const target = email.toLowerCase();
  let page = 1;
  const perPage = 200;
  for (let i = 0; i < 5; i += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) break;
    const user = data.users.find((x) => (x.email || "").toLowerCase() === target);
    if (user) return user;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Format email salah." }, { status: 400 });
  }
  const missing = requireEnv([
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "EMAIL_FROM",
  ]);
  if (missing.length) {
    console.error("[request-otp] Missing ENV:", missing);
    return NextResponse.json(
      { error: `Server belum dikonfigurasi (${missing.join(", ")})` },
      { status: 500 }
    );
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

  const existing = await findUserByEmail(supabase, email);
  if (existing) {
    return NextResponse.json(
      { error: "Email sudah terdaftar. Silakan masuk atau gunakan lupa password." },
      { status: 409 }
    );
  }

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
  const forwardedFor = request.headers.get("x-forwarded-for");
  const createdIp =
    forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;

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
      created_ip: createdIp,
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
