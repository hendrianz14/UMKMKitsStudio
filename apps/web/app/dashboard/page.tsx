import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_NAME } from "lib/session-constants";
import { verifySessionToken } from "lib/session";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? "";
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <div className="rounded-3xl bg-surface/80 p-10 shadow-lg shadow-blue-500/20 backdrop-blur">
        <h1 className="text-3xl font-semibold text-white">Selamat datang!</h1>
        <p className="mt-2 text-base text-white/70">
          Anda masuk sebagai <span className="font-medium text-white">{session.email}</span>.
        </p>
        <p className="mt-6 text-sm text-white/60">
          Menu dashboard lengkap akan hadir segera. Sementara itu, Anda sudah berhasil menguji alur OTP email dengan Supabase.
        </p>
      </div>
    </div>
  );
}
