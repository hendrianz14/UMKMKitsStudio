"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type SubmitState = "idle" | "loading" | "success" | "error";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("Masukkan email kerja Anda.");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const prefillEmail = searchParams?.get("email");
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [searchParams]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const disabled = useMemo(() => status === "loading" || countdown > 0, [status, countdown]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const sanitizedEmail = email.trim();
      if (!sanitizedEmail || disabled) return;
      setStatus("loading");
      setMessage("Mengirim kode...");
      try {
        const response = await fetch("/api/auth/request-otp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: sanitizedEmail }),
          credentials: "include"
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          const errorMessage =
            typeof result?.error === "string"
              ? result.error
              : response.status === 429
              ? "Terlalu sering. Coba lagi 1 menit."
              : "Gagal mengirim kode.";
          setMessage(errorMessage);
          setStatus("error");
          if (response.status === 429) {
            setCountdown(60);
          }
          return;
        }
        setStatus("success");
        setCountdown(60);
        setMessage("Kode dikirim. Cek inbox/spam untuk kode.");
        router.push(`/otp?email=${encodeURIComponent(sanitizedEmail)}`);
        setEmail(sanitizedEmail);
      } catch (error) {
        console.error(error);
        setStatus("error");
        setMessage("Terjadi kesalahan. Coba lagi nanti.");
      }
    },
    [disabled, email, router]
  );

  return (
    <div className="flex min-h-[calc(100dvh-64px)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-surface/80 p-8 shadow-lg shadow-blue-500/20 backdrop-blur">
        <h1 className="text-3xl font-semibold text-white">Masuk dengan Email</h1>
        <p className="mt-2 text-sm text-white/70">
          Kami akan mengirim kode OTP 6 digit ke email kerja Anda.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-white" htmlFor="email">
            Email kerja
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="nama@perusahaan.com"
            className="w-full rounded-lg border border-white/10 bg-background/70 px-4 py-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:bg-blue-600/60"
            disabled={disabled}
          >
            {status === "loading"
              ? "Mengirim kode..."
              : countdown > 0
              ? `Kirim ulang (${countdown})`
              : "Kirim Kode"}
          </button>
        </form>
        <p className="mt-4 text-sm text-white/80">{message}</p>
        <p className="mt-2 text-xs text-white/60">
          Domain email disposable akan ditolak demi keamanan akun Anda.
        </p>
      </div>
    </div>
  );
}

export default function LoginEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-64px)] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-surface/80 p-8 text-center text-white/80">
            Menyiapkan formulir login...
          </div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
