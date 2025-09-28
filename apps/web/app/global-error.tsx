"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // log ke console; jika Sentry tersedia, kirim di sini
    // Sentry?.captureException?.(error);
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html>
      <body className="min-h-dvh bg-background text-foreground">
        <div className="container mx-auto py-10">
          <h1 className="text-2xl font-semibold">Terjadi kesalahan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error.message || "Unknown error"} {error.digest ? `(digest: ${error.digest})` : null}
          </p>
          <button
            onClick={() => reset()}
            className="mt-6 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-primary-foreground hover:bg-primary/90"
          >
            Muat ulang
          </button>
        </div>
      </body>
    </html>
  );
}
