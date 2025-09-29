// apps/web/app/api/auth/complete-signup/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { otpVerifiedRecently } from "@/lib/otp-verified-recent";
import { supaAdmin } from "@/lib/supabase-server";

const Body = z.object({
  full_name: z.string().min(1, "Nama lengkap wajib diisi."),
  email: z.string().email(),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
});

type AdminClient = ReturnType<typeof supaAdmin>;

/** Cari user by email via listUsers (Admin SDK belum ada getUserByEmail) */
async function findUserByEmail(admin: AdminClient, email: string) {
  const target = email.toLowerCase();
  let page = 1;
  const perPage = 200;
  for (let i = 0; i < 10; i++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const u = data.users.find((x) => (x.email || "").toLowerCase() === target);
    if (u) return u;
    if (data.users.length < perPage) break;
    page++;
  }
  return null;
}

/** Upsert profiles & credits trial (hanya jika belum pernah dibuat) */
async function upsertProfileAndTrialCredits(
  admin: AdminClient,
  userId: string,
  fullName: string,
  email: string,
  trialCredits: number,
  trialDays: number
) {
  // profiles
  try {
    const { error } = await admin
      .from("profiles")
      .upsert({ user_id: userId, full_name: fullName, email }, { onConflict: "user_id" });
    if (error && error.code !== "42P01") {
      console.error("[complete-signup] profiles upsert:", error.message || error);
    }
  } catch {}

  // credits: hanya buat jika belum ada baris
  try {
    const { data: cRow } = await admin
      .from("credits")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!cRow) {
      const now = new Date();
      const expires = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
      const { error: eIns } = await admin.from("credits").insert({
        user_id: userId,
        paid_balance: 0,
        trial_balance: Math.max(0, Math.floor(trialCredits || 0)),
        trial_expires_at: expires.toISOString(),
        // balance akan otomatis diset via trigger
      });
      if (eIns && eIns.code !== "42P01") {
        console.error("[complete-signup] credits insert:", eIns.message || eIns);
      }
    }
  } catch {}
}

/** Aktifkan plan 'free' bila user belum punya subscription */
async function activateFreeIfMissing(admin: AdminClient, userId: string) {
  const { data: sub, error } = await admin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error && error.code !== "PGRST116") {
    console.error("[complete-signup] subs select:", error.message || error);
  }
  if (sub) return;

  const now = new Date();
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // periode free default 30 hari
  const { error: insErr } = await admin.from("subscriptions").insert({
    user_id: userId,
    plan_id: "free",
    status: "active",
    current_period_start: now.toISOString(),
    current_period_end: end.toISOString(),
  });
  if (insErr && insErr.code !== "42P01") {
    console.error("[complete-signup] subs insert:", insErr.message || insErr);
  }
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const p = Body.safeParse(json);
  if (!p.success) return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 });

  const fullName = p.data.full_name.trim();
  const email = p.data.email.trim().toLowerCase();
  const password = p.data.password;

  if (!fullName) {
    return NextResponse.json({ error: "Nama lengkap wajib diisi." }, { status: 400 });
  }

  // OTP wajib valid (≤15 menit terakhir)
  const ok = await otpVerifiedRecently(email);
  if (!ok) {
    return NextResponse.json({ error: "OTP tidak valid atau sudah kadaluarsa." }, { status: 400 });
  }

  const admin = supaAdmin();

  // Ambil konfigurasi trial
  const trialCredits = Number(process.env.SIGNUP_TRIAL_CREDITS ?? 0) || 0;
  const trialDays = Number(process.env.SIGNUP_TRIAL_DAYS ?? 7) || 7;

  // Cek user sudah ada?
  let existing: any = null;
  try {
    existing = await findUserByEmail(admin, email);
  } catch (e: any) {
    console.error("[complete-signup] listUsers error:", e?.message || e);
    return NextResponse.json({ error: "AUTH_LIST_USERS_ERROR" }, { status: 500 });
  }

  const finalize = async (userId: string) => {
    await activateFreeIfMissing(admin, userId);
    await upsertProfileAndTrialCredits(admin, userId, fullName, email, trialCredits, trialDays);
    return NextResponse.json({ ok: true });
  };

  // Belum ada → create confirmed
  if (!existing) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error) {
      if (error.status === 422) {
        try { existing = await findUserByEmail(admin, email); } catch {}
      } else {
        console.error("[complete-signup] createUser error:", error.message || error);
        const msg = error.status >= 400 && error.status < 500
          ? error.message || "Tidak dapat membuat akun dengan data tersebut."
          : "Gagal memproses permintaan. Coba lagi nanti.";
        return NextResponse.json({ error: msg }, { status: error.status || 500 });
      }
    }

    if (data?.user?.id) return await finalize(data.user.id);
    // kalau 422 race → lanjut ke cabang existing di bawah
  }

  // Sudah ada
  if (existing) {
    const confirmed = !!(existing.email_confirmed_at || (existing as any).confirmed_at);

    if (!confirmed) {
      const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: { ...(existing.user_metadata || {}), full_name: fullName },
      });
      if (updErr) {
        console.error("[complete-signup] updateUserById error:", updErr.message || updErr);
        return NextResponse.json({ error: "UPDATE_USER_ERROR" }, { status: 500 });
      }
      return await finalize(existing.id);
    }

    // Sudah confirmed → arahkan login (jangan timpa password)
    return NextResponse.json(
      { error: "Email sudah terdaftar. Silakan masuk." },
      { status: 409 }
    );
  }

  return NextResponse.json({ error: "UNKNOWN_STATE" }, { status: 500 });
}
