import { redirect } from "next/navigation";

import { getServerUser } from "@/lib/supabase-server-ssr";
import DashboardClient from "../[locale]/dashboard/_client";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getServerUser();
  if (!user) redirect("/login?redirect=/dashboard");
  return <DashboardClient />;
}
