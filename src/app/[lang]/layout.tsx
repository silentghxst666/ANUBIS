import type { Metadata } from "next";
import { locales } from "@/i18n/config";
import { assertLocale, getDictionary } from "@/i18n/get-dictionary";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
// Self-hosted fonts (Latin + Cyrillic), bundled from npm — no runtime call to Google Fonts.
import "@fontsource-variable/manrope";
import "@fontsource-variable/jetbrains-mono";
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
    <html lang={lang} className="antialiased">
      <body className="flex min-h-dvh flex-col font-sans">
        <Header lang={lang} dict={dict} />
        <main className="flex-1">{children}</main>
        <Footer dict={dict} />
      </body>
    </html>
  );
}
