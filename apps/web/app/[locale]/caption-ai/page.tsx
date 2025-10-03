import { redirect } from "next/navigation";

import { supaServer } from "@/lib/supabase-server-ssr";

import CaptionGeneratorClient from "./CaptionGeneratorClient";

export const dynamic = "force-dynamic";

export default async function CaptionAiPage({
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
    const search = new URLSearchParams({ redirect: `/${locale}/caption-ai` });
    redirect(`/${locale}/sign-in?${search.toString()}`);
  }

  const { data: jobs } = await sb
    .from("ai_jobs")
    .select("id, status, created_at, result_url, meta")
    .eq("user_id", user.id)
    .eq("job_type", "caption")
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <CaptionGeneratorClient
      locale={locale}
      initialHistory={(jobs ?? []).map((job) => ({
        id: job.id,
        status: job.status,
        created_at: job.created_at,
        result_url: job.result_url ?? null,
        meta: job.meta ?? null,
      }))}
    />
  );
}
