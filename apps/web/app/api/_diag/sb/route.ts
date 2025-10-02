export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { supaServer } from "@/lib/supabase-clients";

export async function GET() {
  const sb = supaServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const prof = user
    ? await sb.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
    : null;
  return NextResponse.json({
    user: !!user,
    profile: prof?.data ?? null,
    err: prof?.error ?? null,
  });
}
