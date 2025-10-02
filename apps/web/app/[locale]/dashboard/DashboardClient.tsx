"use client";

import Image from "next/image";
import Link from "next/link";

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

const placeholderCover = "/images/dashboard-placeholder.svg";

const toolLinks = [
  { label: "Caption AI", pathname: "/[locale]/caption" },
  { label: "Gambar AI", pathname: "/[locale]/image" },
  { label: "Editor", pathname: "/[locale]/editor" },
  { label: "Galeri", pathname: "/[locale]/gallery" },
] as const;

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
  const planLabel =
    profile?.plan === "pro"
      ? "Paket Profesional"
      : profile?.plan === "basic"
        ? "Paket Basic"
        : "Free Plan";

  const planExpires = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null;
  const trialExpires = profile?.trial_expires_at ? new Date(profile.trial_expires_at) : null;
  const daysLeft = trialExpires
    ? Math.max(0, Math.ceil((trialExpires.getTime() - Date.now()) / 86_400_000))
    : 0;

  return (
    <div className="space-y-6 px-6 py-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Dasboard AI Anda</h1>
        <p className="text-sm text-gray-400">Pantau penggunaan kredit, kelola project dan pekerjaan AI anda.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-3 rounded-xl border border-white/10 bg-[#10141C] p-5">
          <div className="text-sm text-gray-400">Kredit aktif</div>
          <div className="text-4xl font-extrabold text-white">{profile?.credits ?? 0}</div>
          <div className="text-xs text-gray-300">
            <span className="rounded bg-blue-900/40 px-2 py-1 text-blue-200">{planLabel}</span>
            {planExpires ? (
              <span className="ml-2 text-gray-400">Kedaluwarsa pada {planExpires.toLocaleDateString(locale)}</span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <div className="rounded-full bg-[#0B1220] px-3 py-2 font-semibold text-white">
              FREE CREDITS <span className="ml-1 font-normal">{profile?.trial_credits ?? 0}</span>
            </div>
            <div className="rounded-full bg-[#0B1220] px-3 py-2 text-white">
              <span className="font-semibold">{daysLeft}</span>
              <span className="ml-1 text-gray-400">Days Left</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-white/10 bg-[#10141C] p-5">
          <div className="text-sm text-gray-400">Pekerjaan minggu ini :</div>
          <div className="text-4xl font-extrabold text-white">{jobsThisWeek}</div>
          <p className="text-xs text-gray-400">Ringkasan otomatis dari pekerjaan AI anda.</p>
        </div>

        <div className="relative space-y-3 rounded-xl border border-white/10 bg-[#10141C] p-5">
          <div className="text-sm text-gray-400">Total kredit terpakai :</div>
          <div className="text-4xl font-extrabold text-white">{totalUsed}</div>
          <Link
            href={{ pathname: "/[locale]/billing/topup", params: { locale } } as any}
            className="absolute right-4 top-4 rounded-full bg-blue-900 px-4 py-1 text-sm font-semibold text-blue-100"
          >
            TOPUP
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <section className="rounded-xl border border-white/10 bg-[#10141C] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Project anda</h2>
            <span className="text-xs text-gray-500">{projects.length} aktif</span>
          </div>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {projects.map((project) => {
                const cover = project.cover_url && project.cover_url.trim().length > 0 ? project.cover_url : placeholderCover;
                return (
                  <div key={project.id} className="rounded-xl border border-white/10 bg-[#0C1118] p-3">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                      <Image
                        src={cover}
                        alt={project.title}
                        fill
                        sizes="(min-width: 640px) 30vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="mt-2 truncate font-medium text-white" title={project.title}>
                      {project.title}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/90 transition hover:bg-white/10">
                        BAGIKAN
                      </button>
                      <Link
                        href={{ pathname: "/[locale]/editor", params: { locale } } as any}
                        className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/90 transition hover:bg-white/10"
                      >
                        BUKA EDITOR
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-[#0C1118]/60 p-6 text-center text-sm text-gray-400">
              Belum ada project. Mulai dari Editor untuk membuat project pertama Anda.
            </div>
          )}
        </section>

        <aside className="rounded-xl border border-white/10 bg-[#10141C] p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Riwayat Credits</h2>
            <div className="grid h-7 w-7 place-items-center rounded-full bg-[#0B1220] text-sm text-white">{history.length}</div>
          </div>
          {history.length > 0 ? (
            <div className="divide-y divide-white/10">
              {history.map((item) => {
                const createdAt = new Date(item.created_at);
                const formattedTime = createdAt.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
                const formattedDate = createdAt.toLocaleDateString(locale, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                const amountLabel = item.amount >= 0 ? `+${item.amount}` : `${item.amount}`;
                const amountClass = item.amount >= 0 ? "text-emerald-400" : "text-red-400";
                return (
                  <div key={item.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-sm text-white">{item.reason}</div>
                      <div className="text-xs text-gray-400">
                        {formattedTime} · {formattedDate}
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${amountClass}`}>{amountLabel}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-[#0C1118]/60 p-6 text-center text-sm text-gray-400">
              Belum ada transaksi kredit.
            </div>
          )}
        </aside>
      </div>

      <section className="rounded-xl border border-white/10 bg-[#10141C] p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Alat</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {toolLinks.map((tool) => (
            <Link
              key={tool.label}
              href={{ pathname: tool.pathname, params: { locale } } as any}
              className="rounded-full bg-[#0B1220] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#12203A]"
            >
              {tool.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
