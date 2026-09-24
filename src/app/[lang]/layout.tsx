import type { Metadata } from "next";
import Script from "next/script";
import { locales } from "@/i18n/config";
import { assertLocale, getDictionary } from "@/i18n/get-dictionary";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Cursor from "@/components/Cursor";
import { themeBootScript } from "@/lib/theme";
// Self-hosted fonts (Latin + Cyrillic), bundled from npm — no runtime call to Google Fonts.
import "@fontsource-variable/manrope";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/unbounded";
import "../globals.css";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const lang = assertLocale((await params).lang);
  const dict = await getDictionary(lang);
  return {
    metadataBase: new URL("https://sibuna.net"),
    title: { default: "ANUBIS", template: "%s — ANUBIS" },
    description: dict.meta.description,
    alternates: { languages: { en: "/en", ru: "/ru" } },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const lang = assertLocale((await params).lang);
  const dict = await getDictionary(lang);

  return (
    // The boot script may switch data-theme before hydration; that difference is expected.
    <html lang={lang} className="antialiased" data-theme="dark" suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col font-sans">
        {/* Sets the saved theme before the page paints, so it never flashes. */}
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBootScript}
        </Script>
        <a
          href="#content"
          className="label sr-only z-50 bg-bg px-4 py-3 text-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          {dict.nav.skip}
        </a>
        <Header lang={lang} dict={dict} />
        <main id="content" className="flex-1">
          {children}
        </main>
        <Footer dict={dict} />
        <Cursor viewLabel={dict.product.view} />
      </body>
    </html>
  );
}
