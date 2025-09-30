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
    redirect(`/login?redirect=/${locale}/editor`);
  }
  return <EditorClient />;
}
