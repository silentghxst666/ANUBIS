import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import Logo from "./Logo";
import CartLink from "./CartLink";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";

// Thin glass bar in the page colour: floats over the 3D hero and every section below.
export default function Header({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/70 text-fg backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={`/${lang}`} aria-label="ANUBIS">
          <Logo />
        </Link>
        <nav aria-label={dict.nav.menu} className="flex items-center gap-3 sm:gap-8">
          <Link href={`/${lang}/shop`} className="label transition-opacity hover:opacity-60">
            {dict.nav.shop}
          </Link>
          <LanguageSwitcher current={lang} label={dict.nav.language} />
          <ThemeToggle toLight={dict.nav.toLight} toDark={dict.nav.toDark} />
          <CartLink href={`/${lang}/cart`} label={dict.nav.cart} />
        </nav>
      </div>
    </header>
  );
}
