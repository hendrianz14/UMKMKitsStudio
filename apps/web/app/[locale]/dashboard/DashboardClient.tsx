"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

const placeholderCover = "/images/dashboard-placeholder.svg";

const toolLinks = [
  { label: "Caption AI", pathname: "/[locale]/caption" },
  { label: "Gambar AI", pathname: "/[locale]/image" },
  { label: "Editor", pathname: "/[locale]/editor" },
  { label: "Galeri", pathname: "/[locale]/gallery" },
] as const;

type Profile = {
  plan: string | null;
  plan_expires_at: string | null;
  credits: number | null;
  trial_credits: number | null;
  trial_expires_at: string | null;
  full_name: string | null;
} | null;

type CreditTransaction = {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
};

type Project = {
  id: string;
  title: string;
  cover_url: string | null;
  updated_at: string;
};

type DashboardClientProps = {
  locale: string;
  profile: Profile;
  jobsThisWeek: number;
  totalUsed: number;
  history: CreditTransaction[];
  projects: Project[];
};

export default function DashboardClient({
  locale,
  profile,
  jobsThisWeek,
  totalUsed,
  history,
  projects,
}: DashboardClientProps) {
  const topupHref = useMemo(
    () => ({ pathname: "/[locale]/billing/topup", params: { locale } } as const),
    [locale]
  );
  const editorHref = useMemo(
    () => ({ pathname: "/[locale]/editor", params: { locale } } as const),
    [locale]
  );

  const planLabel = mapPlanLabel(profile?.plan);
  const creditsValue = typeof profile?.credits === "number" ? profile.credits : 0;
  const mondayJobs = jobsThisWeek ?? 0;
  const usedCredits = totalUsed ?? 0;
  const trialCredits = typeof profile?.trial_credits === "number" ? profile.trial_credits : 0;

  const trialDaysLeft = (() => {
    if (!profile?.trial_expires_at) return 0;
    const expires = new Date(profile.trial_expires_at);
    const diff = expires.getTime() - Date.now();
    if (Number.isNaN(diff)) return 0;
    return Math.max(0, Math.ceil(diff / 86_400_000));
  })();

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  return (
    <div className="space-y-8 px-6 py-8">
      <header className="space-y-2">
        <p className="text-sm text-gray-400">Selamat datang kembali</p>
        <h1 className="text-3xl font-bold text-white">
          Dasbor AI Anda{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="text-sm text-gray-400">
          Pantau kredit, kelola project terbaru, dan akses alat AI favorit Anda.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-[#10141C] p-6 shadow-sm shadow-black/20">
          <div className="text-sm text-gray-400">Kredit aktif</div>
          <div className="mt-2 text-4xl font-extrabold text-white">
            {numberFormatter.format(creditsValue)}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-300">
            <span className="rounded-full bg-[#182033] px-3 py-1 font-semibold text-blue-100">{planLabel}</span>
            <span className="rounded-full bg-[#0B1220] px-4 py-1 font-semibold text-white">
              FREE CREDITS {numberFormatter.format(trialCredits)}
              <span className="ml-2 text-xs font-normal text-gray-400">
                / {trialDaysLeft} Days Left
              </span>
            </span>
          </div>
          {profile?.plan_expires_at ? (
            <p className="mt-3 text-xs text-gray-500">
              Paket aktif hingga {new Date(profile.plan_expires_at).toLocaleDateString(locale)}
            </p>
          ) : null}
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#10141C] p-6 shadow-sm shadow-black/20">
          <div className="text-sm text-gray-400">Job AI minggu ini</div>
          <div className="mt-2 text-4xl font-extrabold text-white">
            {numberFormatter.format(mondayJobs)}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Total tugas AI yang Anda jalankan sejak Senin.
          </p>
        </article>

        <article className="relative rounded-2xl border border-white/10 bg-[#10141C] p-6 shadow-sm shadow-black/20">
          <div className="text-sm text-gray-400">Kredit terpakai</div>
          <div className="mt-2 text-4xl font-extrabold text-white">
            {numberFormatter.format(usedCredits)}
          </div>
          <Link
            href={topupHref}
            className="absolute right-6 top-6 rounded-full bg-[#1E3A8A] px-4 py-1 text-xs font-semibold text-blue-100 transition hover:bg-[#2749b3]"
          >
            TOPUP
          </Link>
          <p className="mt-3 text-xs text-gray-400">
            Ringkasan kredit yang telah digunakan untuk seluruh alat.
          </p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <article className="rounded-2xl border border-white/10 bg-[#10141C] p-6 shadow-sm shadow-black/20">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Project anda</h2>
              <p className="text-xs text-gray-500">Tiga project terbaru Anda.</p>
            </div>
            <span className="rounded-full bg-[#0B1220] px-3 py-1 text-xs font-medium text-gray-300">
              {projects.length} aktif
            </span>
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {projects.map((project) => {
                const cover = project.cover_url?.trim() ? project.cover_url : placeholderCover;
                const formattedDate = new Date(project.updated_at).toLocaleDateString(locale, {
                  day: "2-digit",
                  month: "short",
                });

                return (
                  <div
                    key={project.id}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0C1118] p-4"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#111827]">
                      <Image
                        src={cover}
                        alt={project.title}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
                        priority={false}
                      />
                    </div>
                    <div>
                      <p className="truncate text-sm font-semibold text-white" title={project.title}>
                        {project.title}
                      </p>
                      <p className="text-xs text-gray-500">Terakhir diperbarui {formattedDate}</p>
                    </div>
                    <div className="mt-auto flex items-center gap-2">
                      <button
                        type="button"
                        className="flex-1 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/10"
                      >
                        BAGIKAN
                      </button>
                      <Link
                        href={editorHref}
                        className="flex-1 rounded-full border border-white/20 px-3 py-1 text-center text-xs font-semibold text-white transition hover:bg-white/10"
                      >
                        BUKA EDITOR
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#0C1118]/60 p-8 text-center text-sm text-gray-400">
              Belum ada project. Mulai dari Editor untuk membuat project pertama Anda.
            </div>
          )}
        </article>

        <aside className="rounded-2xl border border-white/10 bg-[#10141C] p-6 shadow-sm shadow-black/20">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Riwayat Credits</h2>
              <p className="text-xs text-gray-500">10 transaksi terbaru.</p>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0B1220] text-xs font-semibold text-white">
              {history.length}
            </span>
          </div>

          {history.length > 0 ? (
            <ul className="divide-y divide-white/10">
              {history.map((item) => {
                const createdAt = new Date(item.created_at);
                const time = createdAt.toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const date = createdAt.toLocaleDateString(locale, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                const amount = item.amount ?? 0;
                const positive = amount >= 0;

                return (
                  <li key={item.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{item.reason}</p>
                      <p className="text-xs text-gray-500">
                        {time} · {date}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${positive ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {positive
                        ? `+${numberFormatter.format(Math.abs(amount))}`
                        : `-${numberFormatter.format(Math.abs(amount))}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#0C1118]/60 p-8 text-center text-sm text-gray-400">
              Belum ada transaksi kredit.
            </div>
          )}
        </aside>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#10141C] p-6 shadow-sm shadow-black/20">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-white">Alat</h2>
          <p className="text-xs text-gray-500">Pintasan ke tools yang paling sering digunakan.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {toolLinks.map((tool) => {
            const href = { pathname: tool.pathname, params: { locale } } as const;
            return (
              <Link
                key={tool.label}
                href={href}
                className="rounded-full bg-[#0B1220] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#162647]"
              >
                {tool.label}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function mapPlanLabel(plan: string | null | undefined) {
  if (!plan) return "Free Plan";
  const normalized = plan.toLowerCase();
  if (normalized === "basic") return "Basic";
  if (normalized === "pro") return "Pro";
  return plan;
}
