export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { supaAdmin } from "@/lib/supabase-server";

async function upsertProfile(
  admin: ReturnType<typeof supaAdmin>,
  userId: string,
  fullName: string,
  email: string
) {
  try {
    const { error } = await admin
      .from("profiles")
      .upsert(
        { user_id: userId, full_name: fullName || email.split("@")[0], email },
        { onConflict: "user_id" }
      );
    if (error && (error as { code?: string }).code !== "42P01") {
      console.error("[oauth-bootstrap] profiles upsert:", error);
    }
  } catch (error) {
    console.error("[oauth-bootstrap] profiles upsert:", (error as { message?: string })?.message ?? error);
  }
}

async function ensureCredits(
  admin: ReturnType<typeof supaAdmin>,
  userId: string,
  trialCredits = 0,
  trialDays = 7
) {
  try {
    const { data } = await admin.from("credits").select("user_id").eq("user_id", userId).maybeSingle();
    if (!data) {
      const now = new Date();
      const expires = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
      await admin.from("credits").insert({
        user_id: userId,
        paid_balance: 0,
        trial_balance: Math.max(0, Math.floor(trialCredits)),
        trial_expires_at: expires.toISOString(),
      });
    }
  } catch (error) {
    console.error("[oauth-bootstrap] credits upsert:", (error as { message?: string })?.message ?? error);
  }
}

async function ensureFreePlan(admin: ReturnType<typeof supaAdmin>, userId: string) {
  try {
    const { data } = await admin.from("subscriptions").select("id").eq("user_id", userId).maybeSingle();
    if (!data) {
      const now = new Date();
      const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      await admin.from("subscriptions").insert({
        user_id: userId,
        plan_id: "free",
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
      });
    }
  } catch (error) {
    console.error("[oauth-bootstrap] subs upsert:", (error as { message?: string })?.message ?? error);
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ ok: true });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    console.error("[oauth-bootstrap] Missing Supabase URL or anon key");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const sbUser = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await sbUser.auth.getUser();
  if (error || !data?.user) {
    return NextResponse.json({ ok: true });
  }

  const admin = supaAdmin();
  const user = data.user;
  const fullName = (user.user_metadata as { full_name?: string } | null)?.full_name || user.email?.split("@")[0] || "User";
  const email = user.email ?? "";

  if (!email) {
    return NextResponse.json({ ok: true });
  }

  const trialCredits = Number(process.env.SIGNUP_TRIAL_CREDITS ?? 0) || 0;
  const trialDays = Number(process.env.SIGNUP_TRIAL_DAYS ?? 7) || 7;

  await upsertProfile(admin, user.id, fullName, email);
  await ensureCredits(admin, user.id, trialCredits, trialDays);
  await ensureFreePlan(admin, user.id);

  return NextResponse.json({ ok: true });
}
