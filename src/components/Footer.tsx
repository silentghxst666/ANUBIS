import type { Dictionary } from "@/i18n/dictionaries/en";
import Logo from "./Logo";

export default function Footer({ dict }: { dict: Dictionary }) {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <Logo className="text-2xl" />
        <div className="label flex flex-col gap-1 text-muted-dark sm:items-end">
          <span>{dict.footer.city}</span>
          <span>
            © {new Date().getFullYear()} ANUBIS. {dict.footer.rights}
          </span>
        </div>
      </div>
    </footer>
  );
}
