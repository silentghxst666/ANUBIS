"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";

export default function LanguageSwitcher({ current, label }: { current: Locale; label: string }) {
  const pathname = usePathname();
  // "/ru/shop" -> "/en/shop"
  const hrefFor = (locale: Locale) => pathname.replace(/^\/[^/]+/, `/${locale}`);

  return (
    <div className="label flex items-center gap-1" aria-label={label}>
      {locales.map((locale, i) => (
        <span key={locale} className="flex items-center gap-1">
          {i > 0 && <span className="text-muted">/</span>}
          {locale === current ? (
            <span aria-current="true">{locale}</span>
          ) : (
            <Link href={hrefFor(locale)} className="text-muted hover:text-ink" hrefLang={locale}>
              {locale}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
