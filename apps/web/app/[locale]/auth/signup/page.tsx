export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { getServerUser } from "@/lib/supabase-server-ssr";
import SignUpClient from "./_client";

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
    const to = raw && raw.startsWith("/") ? raw : fallback;
    redirect(to as unknown as import("next").Route);
  }
  return <SignUpClient />;
}
