import { NextResponse } from "next/server";
import { z } from "zod";

import { otpVerifiedRecently } from "@/lib/otp-verified-recent";
import { supaAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

const completeSignupSchema = z.object({
  full_name: z.string().min(1, "Nama lengkap wajib diisi."),
  email: z.string().email(),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = completeSignupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 });
  }

  const fullName = parsed.data.full_name.trim();
  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;

  if (!fullName) {
    return NextResponse.json({ error: "Nama lengkap wajib diisi." }, { status: 400 });
  }

  const recentlyVerified = await otpVerifiedRecently(email);

  if (!recentlyVerified) {
    return NextResponse.json(
      { error: "OTP tidak valid atau sudah kadaluarsa." },
      { status: 400 },
    );
  }

  const supabase = supaAdmin();

  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError || !createdUser?.user?.id) {
    console.error("[complete-signup] Failed to create user", createError);
    const status = createError?.status ?? 500;
    const message =
      status >= 400 && status < 500
        ? createError?.message ?? "Tidak dapat membuat akun dengan data tersebut."
        : "Gagal memproses permintaan. Coba lagi nanti.";

    return NextResponse.json({ error: message }, { status: status >= 400 ? status : 500 });
  }

  const userId = createdUser.user.id;

  try {
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ user_id: userId, full_name: fullName }, { onConflict: "user_id" });

    if (profileError && profileError.code !== "42P01") {
      console.error("[complete-signup] Failed to upsert profile", profileError);
    }
  } catch (error) {
    console.error("[complete-signup] Unexpected error while upserting profile", error);
  }

  return NextResponse.json({ ok: true });
}
