export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import type { Route } from "next";
import { supaServer } from "@/app/../lib/supabase-clients";
import DashboardClient from "./DashboardClient";

type ProfileRow = {
  full_name: string | null;
  plan: string | null;
  plan_expires_at: string | null;
  credits: number | null;
  trial_credits: number | null;
  trial_expires_at: string | null;
  onboarding_completed: boolean | null;
  onboarding_answers: any | null;
} | null;

type CreditTx = { id: string; amount: number; reason: string; created_at: string };
type ProjectRow = { id: string; title: string; cover_url: string | null; updated_at: string };

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const sb = supaServer();

  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect((`/${locale}/sign-in?redirect=/${locale}/dashboard` as unknown) as Route);

  // Ensure profile row exists (idempotent, RLS-safe)
  await sb.from("profiles").upsert({ user_id: user.id }).select().single();

  // Include onboarding columns
  const { data: profileData } = await sb
    .from("profiles")
    .select("full_name, plan, plan_expires_at, credits, trial_credits, trial_expires_at, onboarding_completed, onboarding_answers")
    .eq("user_id", user.id)
    .single();
  const profile = (profileData ?? null) as ProfileRow;

  // Start-of-week (Monday)
  const now = new Date();
  const monday = new Date(now);
  const dow = (now.getDay() + 6) % 7;
  monday.setDate(now.getDate() - dow); monday.setHours(0,0,0,0);

  const { count: jobsThisWeek = 0 } = await sb
    .from("ai_jobs").select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", monday.toISOString());

  const { data: negatives } = await sb
    .from("credit_transactions").select("amount")
    .eq("user_id", user.id).lt("amount", 0);
  const totalUsed = (negatives ?? []).reduce((s, r: any) => s + Math.abs(r.amount ?? 0), 0);

  const { data: history } = await sb
    .from("credit_transactions")
    .select("id, amount, reason, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: projects } = await sb
    .from("projects")
    .select("id, title, cover_url, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(12);

  return (
    <DashboardClient
      locale={locale}
      userId={user.id}
      profile={profile}
      jobsThisWeek={jobsThisWeek ?? 0}
      totalUsed={totalUsed}
      history={(history ?? []) as CreditTx[]}
      projects={(projects ?? []) as ProjectRow[]}
    />
  );
}
