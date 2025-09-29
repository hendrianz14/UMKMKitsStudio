import { NextResponse } from "next/server";

import { clearSessionCookie } from "lib/session";

export const runtime = "nodejs";

export async function POST() {
  const headers = new Headers();
  clearSessionCookie(headers);
  return NextResponse.json({ ok: true }, { headers });
}
