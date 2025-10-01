"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

interface AuthProviderButtonsProps {
  className?: string;
  onSuccess?: (providerId: string) => void | Promise<void>;
  onError?: (error: Error, providerId: string) => void;
  disabled?: boolean;
}

const GoogleIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.82-.07-1.64-.23-2.43H12v4.6h6.46a5.5 5.5 0 0 1-2.38 3.62v3h3.84c2.24-2.07 3.54-5.12 3.54-8.79z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.2 0 5.88-1.06 7.84-2.89l-3.84-3c-1.07.74-2.45 1.18-4 1.18-3.08 0-5.69-2.08-6.62-4.88H1.4v3.08A12 12 0 0 0 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.38 14.41a7.18 7.18 0 0 1 0-4.82V6.51H1.4a12 12 0 0 0 0 10.98l3.98-3.08z"
    />
    <path
      fill="#EA4335"
      d="M12 4.73c1.74 0 3.3.6 4.54 1.78l3.4-3.4C17.88 1.09 15.2 0 12 0 7.32 0 2.98 2.7 1.4 6.51l3.98 3.08C6.31 6.81 8.92 4.73 12 4.73z"
    />
  </svg>
);

function getGoogleEnabledFlag() {
  if (process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "true") {
    return true;
  }

  if (process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "false") {
    return false;
  }

  return true;
}

export function AuthProviderButtons({
  className,
  onError,
  onSuccess,
  disabled,
}: AuthProviderButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const providers = useMemo(() => {
    const list: Array<{
      id: string;
      label: string;
      onClick: () => Promise<void> | void;
      icon: ReactNode;
    }> = [];

    if (getGoogleEnabledFlag()) {
      list.push({
        id: "google",
        label: "Masuk dengan Google",
        icon: <GoogleIcon />, // ensure unique instance
        onClick: async () => {
          if (typeof window === "undefined") {
            throw new Error("Window tidak tersedia untuk OAuth redirect");
          }
          const query = window.location.search || "";
          const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${window.location.origin}/auth/callback${query}`,
              queryParams: { prompt: "select_account" },
            },
          });
          if (error) {
            throw error;
          }
        },
      });
    }

    return list;
  }, []);

  const mapProviderError = (error: unknown) => {
    if (error instanceof Error && error.message.includes("Popup closed")) {
      return null;
    }

    if (error instanceof Error && error.message.includes("redirect_uri_mismatch")) {
      return new Error(
        "Konfigurasi Google OAuth belum sesuai (redirect_uri_mismatch). Hubungi tim untuk memperbaruinya."
      );
    }

    return new Error("Gagal masuk dengan Google. Coba lagi nanti.");
  };

  const handleClick = async (providerId: string, action: () => Promise<void> | void) => {
    if (disabled) return;
    try {
      setLoadingProvider(providerId);
      await action();
      await onSuccess?.(providerId);
    } catch (error) {
      const mapped = mapProviderError(error);
      if (mapped) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[auth] Provider login error", error);
        }
        onError?.(mapped, providerId);
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  if (!providers.length) {
    return null;
  }

  return (
    <div className={cn("grid gap-3", className)}>
      {providers.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          size="lg"
          className="w-full justify-center gap-3 border border-border bg-background/60 text-foreground hover:bg-background"
          disabled={disabled || loadingProvider !== null}
          onClick={() => void handleClick(provider.id, provider.onClick)}
        >
          {loadingProvider === provider.id ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            provider.icon
          )}
          <span className="ml-2 text-sm font-semibold">{provider.label}</span>
        </Button>
      ))}
    </div>
  );
}

export default AuthProviderButtons;
