import { redirect } from "next/navigation";

import { getServerUser, supaServer } from "@/lib/supabase-server-ssr";
import DashboardClient from "./_client";

export const dynamic = "force-dynamic";

type ProfileRow = {
  onboarding_completed?: boolean | null;
  onboarding_answers?: Record<string, unknown> | null;
};

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getServerUser();
  if (!user) {
    const search = new URLSearchParams({ redirect: `/${locale}/dashboard` });
    redirect(`/${locale}/sign-in?${search.toString()}`);
  }

  const sb = await supaServer();
  const { data: profile, error } = await sb
    .from("profiles")
    .select("onboarding_completed,onboarding_answers")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116" && error.code !== "42P01") {
    console.warn("[dashboard] Failed to load onboarding profile", error);
  }

  return <DashboardClient profile={(profile as ProfileRow | null) ?? null} />;
}
