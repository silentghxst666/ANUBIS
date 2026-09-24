import type { Dictionary } from "@/i18n/dictionaries/en";
import Logo from "./Logo";

export default function Footer({ dict }: { dict: Dictionary }) {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pb-10 pt-20 sm:px-6">
        <Logo className="text-[clamp(2.5rem,12vw,9rem)] leading-none tracking-[0.2em]" />
        <div className="label flex flex-col gap-2 text-muted-dark sm:flex-row sm:justify-between">
          <span>{dict.footer.tagline}</span>
          <span>{dict.footer.city}</span>
          <span>
            © {new Date().getFullYear()} ANUBIS. {dict.footer.rights}
          </span>
        </div>
      </div>
    </footer>
  );
}
