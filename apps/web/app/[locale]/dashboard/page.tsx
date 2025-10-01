import { redirect } from "next/navigation";

import { getServerUser, supaServer } from "@/lib/supabase-server-ssr";
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
    redirect(`/${locale}/auth/login?redirect=/${locale}/dashboard`);
  }

  const supabase = await supaServer();
  const columns = "onboarding_completed,has_onboarded,onboarding";
  const { data, error } = await supabase
    .from("profiles")
    .select(columns)
    .eq("user_id", user.id)
    .maybeSingle();

  let profile = data as
    | ({ onboarding_completed?: boolean | null; has_onboarded?: boolean | null; onboarding?: boolean | null } | null)
    | null;

  if (error) {
    if (error.code === "42703") {
      const fallback = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (!fallback.error) {
        profile = fallback.data as typeof profile;
      }
    } else if (error.code !== "42P01") {
      console.warn("[dashboard] Failed to load onboarding profile", error);
    }
  }

  const completed = Boolean(
    profile &&
      (profile.onboarding_completed === true || profile.has_onboarded === true || profile.onboarding === true)
  );

  if (!completed) {
    redirect(`/${locale}/onboarding`);
  }

  return <DashboardClient />;
}
