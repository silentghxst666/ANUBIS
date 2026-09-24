import "server-only";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";

const dictionaries = {
  en: () => import("./dictionaries/en").then((m) => m.default),
  ru: () => import("./dictionaries/ru").then((m) => m.default),
};

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}

/** Validates the `[lang]` route param and returns it narrowed to Locale (404 otherwise). */
export function assertLocale(value: string): Locale {
  if (!isLocale(value)) notFound();
  return value;
}
