export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { supaServer } from "@/lib/supabase-clients";

const Payload = z.object({
  answers: z.object({
    usage_type: z.enum(["personal", "team"]),
    purpose: z.string().min(1),
    business_type: z.string().min(1),
    ref_source: z.string().min(1),
    other_note: z.string().optional(),
  }),
});

export async function POST(req: Request) {
  const sb = supaServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Payload.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { error } = await sb
    .from("profiles")
    .update({
      onboarding_completed: true,
      onboarding_answers: parsed.data.answers,
      onboarding_updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "DB_ERROR" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
