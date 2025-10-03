export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";

import { supaAdmin } from "@/lib/supabase-server";

const CallbackSchema = z.object({
  jobId: z.string().uuid(),
  status: z.enum(["queued", "processing", "succeeded", "failed", "cancelled"]).default("succeeded"),
  resultUrl: z.string().url().optional(),
  meta: z.record(z.any()).optional(),
  insights: z.any().optional(),
  variations: z.array(z.any()).optional(),
  hashtags: z.array(z.string()).optional(),
  primary: z.string().optional(),
});

export async function POST(req: Request) {
  const token = req.headers.get("x-callback-token");
  const secret = process.env.N8N_CALLBACK_SECRET;

  if (!secret || !token || token !== secret) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = CallbackSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD", details: parsed.error.flatten() }, { status: 400 });
  }

  const admin = supaAdmin();

  await admin
    .from("ai_jobs")
    .update({
      status: parsed.data.status,
      result_url: parsed.data.resultUrl ?? null,
      meta: {
        ...(parsed.data.meta ?? {}),
        receivedAt: new Date().toISOString(),
        insights: parsed.data.insights ?? null,
        variations: parsed.data.variations ?? null,
        hashtags: parsed.data.hashtags ?? null,
        primary: parsed.data.primary ?? null,
      },
    })
    .eq("id", parsed.data.jobId)
    .catch((error: unknown) => {
      console.error("[caption-ai] Failed to update job from callback", error);
    });

  return NextResponse.json({ ok: true });
}
