export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { supaServer } from "@/lib/supabase-server-ssr";

export async function POST() {
  const sb = await supaServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await sb
    .from("profiles")
    .update({ onboarding_completed: false, onboarding_answers: null })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
