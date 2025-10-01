export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

const Body = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const p = Body.safeParse(json);
  if (!p.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const c = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          c.getAll().map((cookie) => ({ name: cookie.name, value: cookie.value })),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            c.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.setSession({
    access_token: p.data.access_token,
    refresh_token: p.data.refresh_token,
  });
  if (error) return NextResponse.json({ error: "SET_SESSION_FAILED" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
