"use client";

import { setTheme, useTheme } from "@/lib/theme";

/** Small half-moon switch between the dark and light theme. */
export default function ThemeToggle({ toLight, toDark }: { toLight: string; toDark: string }) {
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  const label = theme === "dark" ? toLight : toDark;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-60"
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.2" />
        {/* The filled half turns over with the theme. */}
        <path
          d="M8 1a7 7 0 0 1 0 14z"
          fill="currentColor"
          className="origin-center transition-transform duration-700"
          style={{ transform: theme === "dark" ? "rotate(0deg)" : "rotate(180deg)" }}
        />
      </svg>
    </button>
  );
}
