export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { supaServer } from "@/lib/supabase-server-ssr";

export async function POST() {
  const supabase = await supaServer();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const candidates: Array<"onboarding_completed" | "has_onboarded" | "onboarding"> = [
    "onboarding_completed",
    "has_onboarded",
    "onboarding",
  ];

  let updated = false;

  for (const column of candidates) {
    const payload: Record<string, unknown> = {
      user_id: user.id,
    };
    payload[column] = true;

    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" });

    if (!error) {
      updated = true;
      break;
    }

    if (error.code === "42703" || error.code === "42P01") {
      continue;
    }

    console.error(`[onboarding-complete] Failed to update ${column}`, error);
    return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
  }

  if (!updated) {
    console.warn("[onboarding-complete] No onboarding flag column found");
  }

  return NextResponse.json({ ok: true });
}
