import Link from "next/link";

// not-found.tsx receives no params, so it is bilingual rather than localized.
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-32 sm:px-6">
      <p className="label text-muted">404</p>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
        Page not found
        <br />
        <span className="text-muted">Страница не найдена</span>
      </h1>
      <Link href="/" className="label border border-ink px-6 py-4 hover:bg-ink hover:text-paper">
        ANUBIS →
      </Link>
    </div>
  );
}
