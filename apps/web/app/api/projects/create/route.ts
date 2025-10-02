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

  const { title, cover_url } = await req.json();

  const { error } = await sb
    .from("projects")
    .insert({ user_id: user.id, title, cover_url });

  if (error) {
    return NextResponse.json({ error: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
