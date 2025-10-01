import { redirect } from "next/navigation";
import type { Route } from "next";

import { getServerUser, supaServer } from "@/lib/supabase-server-ssr";
import OnboardingClient from "./_client";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getServerUser();
  if (!user) {
    redirect(`/${locale}/auth/login?redirect=/${locale}/onboarding`);
  }

  const supabase = await supaServer();
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed,has_onboarded,onboarding")
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
      console.warn("[onboarding] Failed to load profile", error);
    }
  }

  const completed = Boolean(
    profile &&
      (profile.onboarding_completed === true || profile.has_onboarded === true || profile.onboarding === true)
  );

  if (completed) {
    redirect(`/${locale}/dashboard` as Route);
  }

  return <OnboardingClient />;
}
