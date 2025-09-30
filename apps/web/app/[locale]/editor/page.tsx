import { redirect } from "next/navigation";

import { getServerUser } from "@/lib/supabase-server-ssr";
import EditorClient from "./_client";

export default async function Page({
  params,
}: {
  params: { locale: string };
}) {
  const user = await getServerUser();
  if (!user) {
    redirect(`/login?redirect=/${params.locale}/editor`);
  }
  return <EditorClient />;
}
