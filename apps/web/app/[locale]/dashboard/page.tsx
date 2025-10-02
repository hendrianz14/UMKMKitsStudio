import { redirect } from "next/navigation";

import { getServerUser, supaServer } from "@/lib/supabase-server-ssr";
import { path } from "@/lib/locale-nav";
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
    const signInRoute = path("/[locale]/sign-in", locale);
    redirect(`${signInRoute}?${search.toString()}`);
  }

  const supabase = await supaServer();
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed,onboarding_answers")
    .eq("user_id", user.id)
    .maybeSingle();

  let profile = data as ProfileRow | null;

  if (error) {
    if (error.code === "42703") {
      const fallback = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (!fallback.error) {
        profile = fallback.data as ProfileRow | null;
      }
    } else if (error.code !== "42P01") {
      console.warn("[dashboard] Failed to load onboarding profile", error);
    }
  }

  return <DashboardClient profile={profile ?? { onboarding_completed: false }} />;
}
