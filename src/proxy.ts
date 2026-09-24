import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, localeCookie, locales, type Locale } from "@/i18n/config";

function preferredLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(localeCookie)?.value;
  if (isLocale(saved)) return saved;

  // "ru-RU,ru;q=0.9,en;q=0.8" -> first supported language wins
  const header = request.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const lang = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (isLocale(lang)) return lang;
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const current = locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));

  if (current) {
    // Remember the language the visitor is browsing in.
    const response = NextResponse.next();
    if (request.cookies.get(localeCookie)?.value !== current) {
      response.cookies.set(localeCookie, current, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    }
    return response;
  }

  request.nextUrl.pathname = `/${preferredLocale(request)}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Skip Next internals, API routes and any file with an extension (images, icons, robots.txt…)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
