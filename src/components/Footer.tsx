import type { Dictionary } from "@/i18n/dictionaries/en";
import Reveal from "./Reveal";

export default function Footer({ dict }: { dict: Dictionary }) {
  return (
    <footer className="overflow-hidden border-t border-line bg-bg text-fg">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 pb-10 pt-24 sm:px-6">
        <Reveal>
          <p
            aria-label="ANUBIS"
            className="wordmark font-display pl-[0.18em] text-center text-[clamp(2rem,11vw,9rem)] font-extralight leading-none"
          >
            ANUBIS
          </p>
        </Reveal>
        <div className="label flex flex-col gap-2 border-t border-line pt-6 text-muted sm:flex-row sm:justify-between">
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
