export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

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
  const search = searchParams ? await searchParams : undefined;
  const user = await getServerUser();
  if (user) {
    const raw = search?.redirect;
    const fallback = `/${locale}/dashboard`;
    const to = raw && raw.startsWith("/") ? raw : fallback;
    redirect(to);
  }
  return <SignInClient />;
}
