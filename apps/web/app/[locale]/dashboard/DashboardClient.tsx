"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { supabaseBrowser } from "@/lib/supabase-browser";
import OnboardingModal from "@/components/onboarding/OnboardingModal";

const placeholderCover = "/images/dashboard-placeholder.svg";

type Profile = {
  plan: string | null;
  plan_expires_at: string | null;
  credits: number | null;
  trial_credits: number | null;
  trial_expires_at: string | null;
  full_name: string | null;
  onboarding_completed: boolean | null;
  onboarding_answers: {
    usage_type?: "personal" | "team";
    purpose?: string;
    business_type?: string;
    ref_source?: string;
    other_note?: string;
  } | null;
} | null;

type TX = {
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

type OnboardingAnswers = {
  usage_type: "personal" | "team";
  purpose: string;
  business_type: string;
  ref_source: string;
  other_note?: string;
};

export default function DashboardClient({
  locale,
  profile: initialProfile,
  jobsThisWeek: initialJobs,
  totalUsed: initialUsed,
  history: initialHistory,
  projects: initialProjects,
  userId,
}: {
  locale: string;
  profile: Profile;
  jobsThisWeek: number;
  totalUsed: number;
  history: TX[];
  projects: Project[];
  userId: string;
}) {
  const sb = supabaseBrowser;
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [jobsThisWeek] = useState(initialJobs);
  const [totalUsed, setTotalUsed] = useState(initialUsed);
  const [history, setHistory] = useState<TX[]>(initialHistory);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [showOnboarding, setShowOnboarding] = useState(
    !initialProfile?.onboarding_completed
  );

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    setShowOnboarding(!profile?.onboarding_completed);
  }, [profile?.onboarding_completed]);

  const topupHref = useMemo(
    () => (`/${locale}/billing/topup` as Route),
    [locale]
  );
  const editorHref = useMemo(
    () => (`/${locale}/editor` as Route),
    [locale]
  );

  useEffect(() => {
    const channel = sb
      .channel("realtime-dashboard")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "credit_transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const tx = payload.new as TX;
          setHistory((current) => [tx, ...current].slice(0, 10));
          if (tx.amount < 0) {
            setTotalUsed((prev) => prev + Math.abs(tx.amount));
          }
          setProfile((prev) => {
            const credits = (prev?.credits ?? 0) + tx.amount;
            if (!prev) {
              return {
                plan: null,
                plan_expires_at: null,
                credits,
                trial_credits: 0,
                trial_expires_at: null,
                full_name: null,
                onboarding_completed: null,
                onboarding_answers: null,
              };
            }
            return { ...prev, credits };
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          const { data } = await sb
            .from("projects")
            .select("id, title, cover_url, updated_at")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false })
            .limit(12);
          if (data) {
            setProjects(data as Project[]);
          }
        }
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, [sb, userId]);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const planLabel = useMemo(() => {
    const value = profile?.plan?.toLowerCase();
    if (value === "pro") return "Pro Plan";
    if (value === "basic") return "Basic Plan";
    if (value) return `${value.charAt(0).toUpperCase()}${value.slice(1)} Plan`;
    return "Free Plan";
  }, [profile?.plan]);

  const daysLeft = useMemo(() => {
    if (!profile?.trial_expires_at) return 0;
    const diff = new Date(profile.trial_expires_at).getTime() - Date.now();
    if (Number.isNaN(diff)) return 0;
    return Math.max(0, Math.ceil(diff / 86_400_000));
  }, [profile?.trial_expires_at]);

  const StatCard = ({
    title,
    value,
    right,
    desc,
  }: {
    title: string;
    value: ReactNode;
    right?: ReactNode;
    desc?: ReactNode;
  }) => (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 20px 32px rgba(15,23,42,0.35)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0E141B] to-[#0A0F16] p-5"
    >
      {right ? <div className="absolute right-4 top-4">{right}</div> : null}
      <div className="text-sm text-gray-400">{title}</div>
      <div className="mt-2 text-5xl font-extrabold tracking-tight text-white">{value}</div>
      {desc ? <div className="mt-3 text-xs text-gray-400">{desc}</div> : null}
      <div className="pointer-events-none absolute -top-24 -right-20 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
    </motion.div>
  );

  const ProjectCard = ({ project }: { project: Project }) => (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="rounded-xl border border-white/10 bg-[#0C1118] p-3"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
        <Image
          src={project.cover_url || placeholderCover}
          alt={project.title}
          fill
          sizes="(min-width: 768px) 200px, 100vw"
          className="object-cover"
        />
      </div>
      <div className="mt-2 truncate font-medium text-white" title={project.title}>
        {project.title}
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="text-xs font-semibold text-white/90 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded-full border border-white/20 px-3 py-1"
        >
          BAGIKAN
        </button>
        <Link
          href={editorHref}
          className="text-xs font-semibold text-white/90 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded-full border border-white/20 px-3 py-1"
        >
          BUKA EDITOR
        </Link>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8 px-6 py-6">
      {showOnboarding && (
        <OnboardingModal
          open
          onClose={() => setShowOnboarding(false)}
          initial={{
            usage_type: profile?.onboarding_answers?.usage_type ?? "personal",
            purpose: profile?.onboarding_answers?.purpose ?? "",
            business_type: profile?.onboarding_answers?.business_type ?? "",
            ref_source: profile?.onboarding_answers?.ref_source ?? "",
            other_note: profile?.onboarding_answers?.other_note,
          }}
          onSubmit={async (answers: OnboardingAnswers) => {
            await fetch("/api/profile/onboarding/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ answers }),
            });
            setProfile((prev) =>
              prev
                ? {
                    ...prev,
                    onboarding_completed: true,
                    onboarding_answers: answers,
                  }
                : prev
            );
            setShowOnboarding(false);
          }}
        />
      )}

      <div>
        <h1 className="text-3xl font-extrabold text-white md:text-4xl">
          Dasbor AI Anda{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="text-sm text-gray-400">
          Pantau kredit, kelola project terbaru, dan akses alat AI favorit Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Kredit aktif"
          value={numberFormatter.format(profile?.credits ?? 0)}
          desc={
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-900/40 px-2 py-1 text-[11px] font-semibold text-blue-200">
                {planLabel}
              </span>
              <span className="rounded-full bg-[#0B1220] px-3 py-1 text-[11px] font-semibold text-gray-300">
                FREE CREDITS {numberFormatter.format(profile?.trial_credits ?? 0)} · {daysLeft} Days Left
              </span>
            </div>
          }
        />
        <StatCard
          title="Job AI minggu ini"
          value={numberFormatter.format(jobsThisWeek)}
          desc="Total tugas AI yang Anda jalankan sejak Senin."
        />
        <StatCard
          title="Kredit terpakai"
          value={numberFormatter.format(totalUsed)}
          right={
            <Link
              href={topupHref}
              className="rounded-full bg-blue-900 px-4 py-1 text-sm font-semibold text-blue-100 transition-colors hover:bg-blue-800"
            >
              TOPUP
            </Link>
          }
          desc="Ringkasan kredit yang telah digunakan untuk seluruh alat."
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        <motion.div
          layout
          className="rounded-2xl border border-white/10 bg-[#10141C] p-5 shadow-[0_20px_45px_-20px_rgba(15,23,42,0.6)]"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Project anda</h2>
            <div className="rounded-full bg-[#0B1220] px-3 py-1 text-xs text-gray-300">
              {projects.length} aktif
            </div>
          </div>
          {projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-[#0C1118]/80 p-8 text-center text-sm text-gray-400">
              Belum ada project. Mulai dari Editor untuk membuat project pertama Anda.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          layout
          className="rounded-2xl border border-white/10 bg-[#10141C] p-5 shadow-[0_20px_45px_-20px_rgba(15,23,42,0.6)]"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Riwayat Credits</h2>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#0B1220] text-xs font-semibold text-white">
              {history.length}
            </div>
          </div>
          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-[#0C1118]/80 p-6 text-center text-sm text-gray-400">
              Belum ada transaksi kredit.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {history.map((item) => {
                const createdAt = new Date(item.created_at);
                const amount = item.amount ?? 0;
                const positive = amount >= 0;
                return (
                  <div key={item.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-sm font-medium text-white">{item.reason}</div>
                      <div className="text-xs text-gray-400">
                        {createdAt.toLocaleTimeString(locale)} · {createdAt.toLocaleDateString(locale)}
                      </div>
                    </div>
                    <div
                      className={`text-sm font-semibold ${positive ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {positive
                        ? `+${numberFormatter.format(Math.abs(amount))}`
                        : `-${numberFormatter.format(Math.abs(amount))}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#10141C] p-5 shadow-[0_20px_45px_-20px_rgba(15,23,42,0.6)]">
        <h2 className="text-lg font-semibold text-white">Alat</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Caption AI", href: "/caption" },
            { label: "Gambar AI", href: "/image" },
            { label: "Editor", href: "/editor" },
            { label: "Galeri", href: "/gallery" },
          ].map((tool) => (
            <Link
              key={tool.label}
              href={`/${locale}${tool.href}` as Route}
              className="rounded-full bg-[#0B1220] px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#12203A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            >
              {tool.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
