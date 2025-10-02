import { redirect } from "next/navigation";

import { getServerUser } from "@/lib/supabase-server-ssr";
import EditorClient from "./_client";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getServerUser();
  if (!user) {
    const search = new URLSearchParams({ redirect: `/${locale}/editor` });
    redirect(`/${locale}/sign-in?${search.toString()}`);
  }
  return <EditorClient />;
}
