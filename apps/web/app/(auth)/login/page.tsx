export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import type { Route } from "next";

import { getServerUser } from "@/lib/supabase-server-ssr";
import LoginClient from "./_client";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string } | undefined>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await getServerUser();
  if (user) {
    const raw = resolvedSearchParams?.redirect;
    const to: Route = raw && raw.startsWith("/") ? (raw as Route) : ("/dashboard" as Route);
    redirect(to);
  }
  return <LoginClient />;
}
