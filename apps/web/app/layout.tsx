import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../styles/globals.css";
import "sonner/dist/styles.css";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

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
      <body
        className={`min-h-dvh bg-background text-foreground antialiased font-sans ${fontSans.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
