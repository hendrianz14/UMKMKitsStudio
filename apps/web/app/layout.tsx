import type { Metadata } from "next";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import "@/styles/globals.css";
import "sonner/dist/styles.css";
import { fontSans } from "@/styles/fonts";

export const metadata: Metadata = {
  title: "UMKM Kits Studio",
  description: "Studio kreatif modern untuk UMKM kuliner dengan dukungan AI.",
};

// (opsional) kalau tidak butuh, hapus baris dynamic di bawah
// export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn("dark", fontSans.variable)}
    >
      <body className="min-h-dvh bg-background text-foreground antialiased font-sans">
        <main className="pt-[var(--nav-h)]">{children}</main>
      </body>
    </html>
  );
}
