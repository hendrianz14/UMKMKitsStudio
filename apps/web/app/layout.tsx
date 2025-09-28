import type { Metadata } from "next";
import "../styles/globals.css";
import "sonner/dist/styles.css";

export const metadata: Metadata = {
  title: "UMKM Kits Studio",
  description: "Studio kreatif modern untuk UMKM kuliner dengan dukungan AI.",
};

// (opsional) kalau tidak butuh, hapus baris dynamic di bawah
// export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
