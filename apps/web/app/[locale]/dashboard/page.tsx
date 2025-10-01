import { redirect } from "next/navigation";

import { getServerUser } from "@/lib/supabase-server-ssr";
import DashboardClient from "./_client";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const user = await getServerUser();
  if (!user) {
    redirect(`/login?redirect=/${locale}/dashboard`);
  }
  return <DashboardClient />;
}
