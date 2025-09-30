import { redirect } from "next/navigation";

import { getServerUser } from "@/lib/supabase-server-ssr";
import LoginClient from "./_client";

export default async function Page() {
  const user = await getServerUser();
  if (user) redirect("/dashboard");
  return <LoginClient />;
}
