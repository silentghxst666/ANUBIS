import type { Metadata } from "next";
import { BRAND_ICONS } from "@/lib/brand";
import "@fontsource-variable/manrope";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/unbounded";
import "../globals.css";

// Separate root layout: the admin is Russian-only, always light, and never indexed.
export const metadata: Metadata = {
  title: { default: "Админка", template: "%s — ANUBIS admin" },
  robots: { index: false, follow: false },
  icons: BRAND_ICONS,
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="ru" data-theme="light" className="antialiased">
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
