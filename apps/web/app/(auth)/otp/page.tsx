"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5001";

function buildUrl(path: string) {
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  return `${base}${path}`;
}

type SubmitState = "idle" | "loading" | "success" | "error";

export default function OtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const displayEmail = email.trim();

  const [code, setCode] = useState("");
  const [message, setMessage] = useState("Masukkan kode 6 digit yang kami kirim ke email Anda.");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!displayEmail) {
      router.replace("/login");
    }
  }, [displayEmail, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const canSubmit = useMemo(() => code.length === 6 && status !== "loading", [code.length, status]);
  const canResend = useMemo(() => countdown === 0 && status !== "loading", [countdown, status]);

  const handleChange = useCallback((value: string) => {
    const sanitized = value.replace(/\D/g, "").slice(0, 6);
    setCode(sanitized);
  }, []);

  const submitOtp = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const targetEmail = displayEmail;
      if (!canSubmit || !targetEmail) return;
      setStatus("loading");
      setMessage("Memverifikasi kode...");
      try {
        const response = await fetch(buildUrl("/auth/verify-otp"), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: targetEmail, code }),
          credentials: "include"
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          const errorMessage =
            typeof result?.error === "string" ? result.error : "Kode salah / kadaluarsa.";
          setMessage(errorMessage);
          setStatus("error");
          if (response.status === 429) {
            setCountdown(60);
          }
          return;
        }
        setStatus("success");
        setMessage("Verifikasi berhasil! Mengarahkan ke dashboard...");
        router.push("/dashboard");
      } catch (error) {
        console.error(error);
        setStatus("error");
        setMessage("Terjadi kesalahan. Coba lagi nanti.");
      }
    },
    [canSubmit, code, displayEmail, router]
  );

  const resendOtp = useCallback(async () => {
    const targetEmail = displayEmail;
    if (!targetEmail || !canResend) return;
    setStatus("loading");
    setMessage("Mengirim ulang kode...");
    try {
      const response = await fetch(buildUrl("/auth/request-otp"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
        credentials: "include"
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMessage =
          typeof result?.error === "string"
            ? result.error
            : response.status === 429
            ? "Terlalu sering. Coba lagi 1 menit."
            : "Gagal mengirim ulang kode.";
        setMessage(errorMessage);
        setStatus("error");
        if (response.status === 429) {
          setCountdown(60);
        }
        return;
      }
      setStatus("success");
      setCode("");
      setCountdown(60);
      setMessage("Kode dikirim ulang. Cek inbox/spam untuk kode.");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage("Terjadi kesalahan. Coba lagi nanti.");
    }
  }, [canResend, displayEmail]);

  return (
    <div className="flex min-h-[calc(100dvh-64px)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-surface/80 p-8 shadow-lg shadow-blue-500/20 backdrop-blur">
        <h1 className="text-3xl font-semibold text-white">Masukkan Kode OTP</h1>
        <p className="mt-2 text-sm text-white/70">
          Kode dikirim ke <span className="font-semibold text-white">{displayEmail}</span>
        </p>
        <form className="mt-6 space-y-4" onSubmit={submitOtp}>
          <label className="block text-sm font-medium text-white" htmlFor="otp">
            Kode 6 digit
          </label>
          <input
            id="otp"
            inputMode="numeric"
            pattern="\d*"
            maxLength={6}
            autoFocus
            value={code}
            onChange={(event) => handleChange(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-background/70 px-4 py-3 text-center text-3xl font-semibold tracking-[0.5em] text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary w-full rounded-lg px-4 py-3 text-base font-semibold"
          >
            {status === "loading" ? "Memproses..." : "Verifikasi"}
          </button>
        </form>
        <button
          type="button"
          onClick={resendOtp}
          disabled={!canResend}
          className="mt-4 w-full rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/40"
        >
          {countdown > 0 ? `Kirim ulang dalam ${countdown}s` : "Kirim ulang kode"}
        </button>
        <p className="mt-4 text-sm text-white/80">{message}</p>
        <p className="mt-2 text-xs text-white/60">
          Tidak menerima kode? Pastikan email Anda bukan domain disposable dan periksa folder spam.
        </p>
      </div>
    </div>
  );
}
