export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import type { Route } from "next";

import { getServerUser } from "@/lib/supabase-server-ssr";
import SignInClient from "../auth/login/_client";

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
    const fallback = ((`/${locale}/dashboard` as unknown) as Route);
    const destination: Route =
      redirectParam && redirectParam.startsWith("/")
        ? ((redirectParam as unknown) as Route)
        : fallback;

    redirect(destination);
  }

  return <SignInClient />;
}
