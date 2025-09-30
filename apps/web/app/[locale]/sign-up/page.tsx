import { redirect } from "next/navigation";

import { getServerUser } from "@/lib/supabase-server-ssr";
import SignUpClient from "./_client";

export default async function Page({
  params,
}: {
  params: { locale: string };
}) {
  const user = await getServerUser();
  if (user) {
    redirect(`/${params.locale}/dashboard`);
  }
  return <SignUpClient />;
}
