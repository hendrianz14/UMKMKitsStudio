import { redirect } from "next/navigation";

import { getServerUser } from "@/lib/supabase-server-ssr";
import DashboardClient from "./_client";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getServerUser();
  if (!user) {
    redirect(`/login?redirect=/${locale}/dashboard`);
  }
  return <DashboardClient />;
}
