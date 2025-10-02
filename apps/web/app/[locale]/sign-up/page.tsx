export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { getServerUser } from "@/lib/supabase-server-ssr";
import { path } from "@/lib/locale-nav";
import SignUpClient from "../auth/signup/_client";

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
    const redirectParam = search?.redirect;
    const fallback = path("/[locale]/dashboard", locale);
    const destination = redirectParam && redirectParam.startsWith("/") ? redirectParam : fallback;

    redirect(destination);
  }

  return <SignUpClient />;
}
