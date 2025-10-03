export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { supaServer } from "@/app/../lib/supabase-clients";

export async function GET() {
  const sb = supaServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ user:false });

  const prof = await sb.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  const tx = await sb.from("credit_transactions").select("id,amount,reason,created_at").eq("user_id", user.id).limit(3);
  const pr = await sb.from("projects").select("id,title,updated_at").eq("user_id", user.id).limit(3);

  return NextResponse.json({
    user: true,
    profile: prof.data ?? null,
    txCount: tx.data?.length ?? 0,
    prjCount: pr.data?.length ?? 0,
    err: prof.error || tx.error || pr.error || null,
  });
}
