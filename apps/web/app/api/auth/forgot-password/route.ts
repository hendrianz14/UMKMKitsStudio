export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

import { defaultLocale, isValidLocale } from "@/lib/i18n";

const Body = z.object({
  email: z.string().email(),
  locale: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const p = Body.safeParse(json);
  if (!p.success) return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const sb = createClient(url, anon);

  const requestedLocale = p.data.locale;
  const locale = requestedLocale && isValidLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const redirectTo = `${process.env.APP_URL}/${locale}/auth/update-password`;

  const { error } = await sb.auth.resetPasswordForEmail(p.data.email, { redirectTo });
  if (error) {
    console.error("[forgot-password] resetPasswordForEmail:", error.message || error);
    return NextResponse.json({ error: "Gagal memproses permintaan. Coba lagi nanti." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
