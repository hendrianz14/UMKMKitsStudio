export const dynamic = "force-dynamic";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { supaServer } from "@/lib/supabase-server-ssr";
import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n";

function resolveLocale(raw: string | undefined): Locale {
  if (raw && isValidLocale(raw)) {
    return raw as Locale;
  }
  return defaultLocale;
}

function resolveOrigin() {
  const headerList = headers();
  const forwardedHost = headerList.get("x-forwarded-host");
  const host = forwardedHost ?? headerList.get("host");
  if (host) {
    const proto = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

function extractString(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const locale = resolveLocale(params.locale);
  const nextParam = extractString(searchParams?.next);
  const fallbackPath = `/${locale}/dashboard`;
  const redirectTarget = nextParam && nextParam.startsWith("/") ? nextParam : fallbackPath;

  const supabase = await supaServer();
  const {
    data: { session: initialSession },
  } = await supabase.auth.getSession();

  let session = initialSession;
  if (!session) {
    const code = extractString(searchParams?.code);
    if (code) {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          session = data.session;
        }
      } catch (error) {
        console.error("[auth/callback] Failed to exchange code", error);
      }
    }
  }

  if (!session) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(redirectTarget)}`);
  }

  const origin = resolveOrigin();
  const cookieStore = await cookies();
  const rawCookies = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  const sessionHeaders: Record<string, string> = { "content-type": "application/json" };
  if (rawCookies) {
    sessionHeaders.cookie = rawCookies;
  }

  try {
    await fetch(`${origin}/api/auth/session-sync`, {
      method: "POST",
      headers: sessionHeaders,
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[auth/callback] session-sync failed", error);
  }

  try {
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  } catch (error) {
    console.error("[auth/callback] Failed to persist session", error);
  }

  try {
    const bootstrapHeaders: Record<string, string> = { Authorization: `Bearer ${session.access_token}` };
    if (rawCookies) {
      bootstrapHeaders.cookie = rawCookies;
    }
    await fetch(`${origin}/api/auth/oauth-bootstrap`, {
      method: "POST",
      headers: bootstrapHeaders,
      cache: "no-store",
    });
  } catch (error) {
    console.error("[auth/callback] oauth-bootstrap failed", error);
  }

  redirect(redirectTarget);
}
