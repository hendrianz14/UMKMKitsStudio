export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";

import { getBaseUrl } from "@/lib/base-url";
import { supaServer } from "@/lib/supabase-server-ssr";

const CaptionRequestSchema = z.object({
  brief: z.string().min(10).max(800),
  platform: z
    .enum(["instagram", "tiktok", "facebook", "whatsapp", "twitter", "linkedin", "general"])
    .default("instagram"),
  tone: z.enum(["friendly", "professional", "playful", "luxurious", "bold"]).default("professional"),
  audience: z.string().max(240).optional(),
  language: z.string().min(2).max(10).default("id"),
  length: z.enum(["short", "medium", "long"]).default("medium"),
  includeHashtags: z.boolean().default(true),
  includeCTA: z.boolean().default(true),
  includeEmoji: z.boolean().default(true),
  customHashtags: z.string().max(240).optional(),
  customCTA: z.string().max(240).optional(),
  brandVoice: z.string().max(400).optional(),
  differentiator: z.string().max(280).optional(),
  keywords: z.array(z.string().max(40)).max(8).optional(),
  competitorAngles: z.array(z.string().max(80)).max(6).optional(),
  variations: z.number().int().min(1).max(5).default(3),
});

const FALLBACK_VARIATIONS = [
  {
    id: "v1",
    caption:
      "✨ Temukan sensasi baru dari kopi gula aren kami yang dibuat fresh setiap jam! Nikmati kombinasi creamy dan karamel yang pas untuk menemani aktivitasmu. Pesan sekarang dan rasakan bedanya!",
    tone: "professional",
  },
  {
    id: "v2",
    caption:
      "Butuh booster semangat? Coba es kopi gula aren favorit pelanggan kami. Dibuat dari biji pilihan dan susu segar, siap mengupgrade harimu hanya dalam satu teguk.",
    tone: "friendly",
  },
  {
    id: "v3",
    caption:
      "Mulai pagi dengan signature coffee kami: gula aren smoky, espresso bold, dan susu silky yang bikin nagih. Grab yours today & tag bestie kamu! ☕",
    tone: "playful",
  },
];

function buildMockResponse(body: z.infer<typeof CaptionRequestSchema>) {
  const first = FALLBACK_VARIATIONS[0]?.caption ?? "";
  return {
    jobId: crypto.randomUUID(),
    status: "succeeded" as const,
    primary: first,
    variations: FALLBACK_VARIATIONS,
    hashtags: body.includeHashtags
      ? body.customHashtags?.split(/[,\n]+/).map((tag) => tag.trim()).filter(Boolean) ?? [
          "#kopilokal",
          "#umkmkreatif",
          "#coffeeholic",
        ]
      : [],
    meta: {
      platform: body.platform,
      tone: body.tone,
      language: body.language,
      length: body.length,
      audience: body.audience ?? null,
      includeCTA: body.includeCTA,
      includeEmoji: body.includeEmoji,
      includeHashtags: body.includeHashtags,
      requestedAt: new Date().toISOString(),
      mock: true,
    },
    insights: {
      hook:
        "Gunakan pertanyaan retoris dan highlight keunikan gula aren lokal untuk menarik perhatian audiens di 3 detik pertama.",
      story:
        "Soroti proses pembuatan handmade dan gunakan kata kerja aktif untuk menggambarkan sensasi rasa secara visual.",
      closing:
        body.includeCTA
          ? body.customCTA ?? "Arahkan audiens ke link pemesanan dengan CTA spesifik seperti ‘Pesan sekarang’ atau ‘Pre-order hari ini’."
          : "Tambahkan CTA ketika siap mengarahkan audiens ke aksi tertentu.",
      promptUsed:
        "You are an expert Indonesian social media strategist for F&B brands. Generate captions that follow the UMKM Kits Studio playbook.",
    },
  };
}

function normaliseStringArray(value?: string | string[] | null) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value
    .split(/[,\n]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export async function POST(req: Request) {
  const sb = await supaServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = CaptionRequestSchema.safeParse({
    ...json,
    keywords: normaliseStringArray(json?.keywords),
    competitorAngles: normaliseStringArray(json?.competitorAngles),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const jobId = crypto.randomUUID();
  const baseUrl = await getBaseUrl();

  const webhookUrl = process.env.N8N_CAPTION_WEBHOOK_URL;
  const webhookToken = process.env.N8N_CAPTION_WEBHOOK_TOKEN;

  let n8nResponse: any = null;
  let n8nStatus: number | null = null;
  let n8nError: string | null = null;

  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(webhookToken ? { Authorization: `Bearer ${webhookToken}` } : {}),
        },
        body: JSON.stringify({
          jobId,
          userId: user.id,
          callbackUrl: `${baseUrl}/api/ai/caption/callback`,
          options: payload,
        }),
      });
      n8nStatus = response.status;
      const text = await response.text();
      try {
        n8nResponse = text ? JSON.parse(text) : {};
      } catch (error) {
        n8nResponse = { raw: text };
      }
      if (!response.ok) {
        n8nError = `N8N_WEBHOOK_ERROR_${response.status}`;
      }
    } catch (error) {
      console.error("[caption-ai] Failed to reach n8n webhook", error);
      n8nError = "N8N_WEBHOOK_UNREACHABLE";
    }
  }

  const effectiveResponse =
    n8nResponse && typeof n8nResponse === "object" && Object.keys(n8nResponse).length > 0
      ? n8nResponse
      : buildMockResponse(payload);

  const status = (effectiveResponse.status as string | undefined) ?? (n8nError ? "failed" : "succeeded");

  await sb
    .from("ai_jobs")
    .insert({
      id: jobId,
      user_id: user.id,
      job_type: "caption",
      status,
      meta: {
        ...payload,
        webhookStatus: n8nStatus,
        webhookError: n8nError,
      },
      result_url: effectiveResponse.resultUrl ?? null,
    })
    .catch((error: unknown) => {
      console.warn("[caption-ai] Failed to record ai_jobs", error);
    });

  return NextResponse.json({
    jobId,
    status,
    primary: effectiveResponse.primary ?? effectiveResponse.caption ?? effectiveResponse.result ?? null,
    variations: effectiveResponse.variations ?? [],
    hashtags: effectiveResponse.hashtags ?? [],
    insights: effectiveResponse.insights ?? null,
    resultUrl: effectiveResponse.resultUrl ?? null,
    meta: {
      ...(effectiveResponse.meta ?? {}),
      requestedAt: new Date().toISOString(),
      jobId,
      webhookError: n8nError,
    },
  });
}
