export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { supaServer } from "@/lib/supabase-server-ssr";

export async function POST(req: Request) {
  const sb = await supaServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount = 100, reason = "Topup" } = await req.json().catch(() => ({
    amount: 100,
    reason: "Topup",
  }));

  const { error } = await sb
    .from("credit_transactions")
    .insert({ user_id: user.id, amount: Number(amount), reason });

  if (error) {
    return NextResponse.json({ error: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
