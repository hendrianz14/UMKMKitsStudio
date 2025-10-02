import { redirect } from "next/navigation";

import { path } from "@/lib/locale-nav";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(path("/[locale]/dashboard", locale));
}
