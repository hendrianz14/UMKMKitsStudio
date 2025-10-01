export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import type { Route } from "next";

import { getServerUser } from "@/lib/supabase-server-ssr";
import SignInClient from "./_client";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ redirect?: string }>;
}) {
  const { locale } = await params;
  const user = await getServerUser();
  if (user) {
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const raw = resolvedSearchParams?.redirect;
    const fallback = `/${locale}/dashboard`;
    const to: Route = raw && raw.startsWith("/") ? (raw as Route) : (fallback as Route);
    redirect(to);
  }
  return <SignInClient />;
}
