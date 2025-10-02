import { redirect } from "next/navigation";
import type { Route } from "next";

import { supaServer } from "@/lib/supabase-server-ssr";

import DashboardClient from "./DashboardClient";

type ProfileRow = {
  plan: string | null;
  plan_expires_at: string | null;
  credits: number | null;
  trial_credits: number | null;
  trial_expires_at: string | null;
  full_name: string | null;
};

type CreditTransactionRow = {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
};

type ProjectRow = {
  id: string;
  title: string;
  cover_url: string | null;
  updated_at: string;
};

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const sb = await supaServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    const redirectPath = (`/${locale}/sign-in?redirect=/${locale}/dashboard` as unknown) as Route;
    redirect(redirectPath);
  }

  const { data: profileRaw } = await sb
    .from("profiles")
    .select("plan, plan_expires_at, credits, trial_credits, trial_expires_at, full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = (profileRaw ?? null) as ProfileRow | null;

  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  const day = monday.getDay();
  const diff = (day + 6) % 7;
  monday.setDate(monday.getDate() - diff);

  const { count: jobsCount } = await sb
    .from("ai_jobs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", monday.toISOString())
    .eq("user_id", user.id);

  const { data: txUsedRows } = await sb
    .from("credit_transactions")
    .select("amount")
    .eq("user_id", user.id)
    .lt("amount", 0);

  const totalUsed = (txUsedRows ?? []).reduce<number>((sum, row) => sum + Math.abs(row.amount), 0);

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
    .limit(3);

  return (
    <DashboardClient
      locale={locale}
      profile={profile}
      jobsThisWeek={jobsCount ?? 0}
      totalUsed={totalUsed}
      history={(history ?? []) as CreditTransactionRow[]}
      projects={(projects ?? []) as ProjectRow[]}
    />
  );
}
