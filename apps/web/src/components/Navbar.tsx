"use client";

import type { UrlObject } from "url";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Menu, Sparkles } from "lucide-react";
import { motion, useScroll } from "framer-motion";
import type { Route } from "next";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { LangToggle } from "../../components/lang-toggle";
import type { Locale } from "../../lib/i18n";
import { isValidLocale } from "../../lib/i18n";
import { cn } from "../../lib/utils";
import AuthNav from "./auth/AuthNav";

const NAV_SECTIONS = [
  { id: 'home', label: 'Beranda' },
  { id: 'features', label: 'Fitur' },
  { id: 'gallery', label: 'Galeri' },
  { id: 'pricing', label: 'Harga' }

] as const;

export function Navbar({ locale = "id", showSections }: { locale?: Locale; showSections?: boolean }) {
  const params = useParams<{ locale?: string }>();
  const pathname = usePathname();

  const localeFromParams = params?.locale && isValidLocale(params.locale) ? params.locale : undefined;
  const resolvedLocale = localeFromParams ?? locale;
  const basePath: `/${Locale}` | "/" = localeFromParams ? `/${localeFromParams}` : "/";
  const base: `/${Locale}` | "" = localeFromParams ? `/${localeFromParams}` : "";
  const shouldShowSections =
    showSections ?? (pathname === "/" || pathname === `${base || "/"}`);
  const [active, setActive] = useState("home");

  const [isSheetOpen, setSheetOpen] = useState(false);
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const unsub = scrollY.on("change", (value) => setScrolled(value > 10));
    return () => unsub();
  }, [scrollY]);

  useEffect(() => {
    if (!shouldShowSections) return;
    const sections = NAV_SECTIONS.map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      { threshold: [0.25, 0.6], rootMargin: '-80px 0px -40%' }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [shouldShowSections]);

  const navItems = useMemo(() => (shouldShowSections ? NAV_SECTIONS : []), [shouldShowSections]);
  const marketingPathname = basePath as Route;
  const dashboardPath = (base ? `${base}/dashboard` : "/dashboard") as Route;
  const brandHref: UrlObject = pathname?.startsWith(dashboardPath)
    ? { pathname }
    : { pathname: marketingPathname };

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: scrolled ? 'rgba(11, 15, 26, 0.92)' : 'rgba(11, 15, 26, 0.6)',
        backdropFilter: scrolled ? 'blur(14px)' : 'blur(10px)',
        borderColor: scrolled ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.15)'
      }}
      className="fixed inset-x-0 top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur lg:h-20"
    >
      <div className="container flex h-full items-center justify-between gap-4">
        <Link href={brandHref} className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-accent text-white shadow-lg shadow-blue-600/40">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-base text-white">UMKM Kits Studio</span>
        </Link>
        {shouldShowSections ? (
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={{ pathname: marketingPathname, hash: item.id }}
                className={cn(
                  "relative px-2 py-1 text-[var(--text-muted)] transition-colors hover:text-white",
                  active === item.id && "text-white"
                )}
              >
                {active === item.id && (
                  <motion.span
                    layoutId="navbar-active"
                    className="absolute inset-0 -z-10 rounded-full bg-white/10"
                    transition={{ type: "spring", stiffness: 260, damping: 25 }}
                  />
                )}
                {item.label}
              </Link>
            ))}
          </nav>
        ) : (
          <div className="hidden md:flex" />
        )}
        <div className="hidden items-center gap-2 md:flex">
          <LangToggle />
          <AuthNav fallbackLocale={resolvedLocale} />
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <LangToggle />
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs">
              <SheetHeader>
                <SheetTitle className="text-left text-white">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-3">
                {shouldShowSections
                  ? navItems.map((item) => (
                      <Button
                        key={item.id}
                        variant={active === item.id ? "default" : "secondary"}
                        className="justify-start"
                        onClick={() => setSheetOpen(false)}
                        asChild
                      >

                        <Link href={{ pathname: marketingPathname, hash: item.id }}>{item.label}</Link>

                      </Button>
                    ))
                  : null}
              </div>
              <AuthNav
                layout="column"
                fallbackLocale={resolvedLocale}
                onNavigate={() => setSheetOpen(false)}
                className="mt-8"
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
