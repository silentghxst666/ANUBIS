import { EYE_PATH, EYE_VIEWBOX } from "./experience/eye-path";

/** The Eye of Horus sigil, drawn in the current text colour so it follows the theme. */
export function Sigil({ className = "" }: { className?: string }) {
  return (
    <svg viewBox={EYE_VIEWBOX.join(" ")} className={className} aria-hidden>
      <path fill="currentColor" fillRule="evenodd" d={EYE_PATH} />
    </svg>
  );
}

/** Header lockup: sigil + wordmark. */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Sigil className="h-7 w-7 sm:h-6 sm:w-6" />
      {/* Phones show the sigil alone so the navigation fits. */}
      <span className="hidden font-display text-sm font-medium tracking-[0.28em] sm:inline">ANUBIS</span>
    </span>
  );
}
