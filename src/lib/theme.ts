"use client";

import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

export const THEME_KEY = "anubis-theme";
const EVENT = "anubis-theme-change";

/**
 * Runs inline in <head> before the first paint so the saved theme never flashes.
 * Dark is the brand default; a saved choice wins.
 */
export const themeBootScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}})()`;

function read(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Private mode / blocked storage: the choice lasts for this page view only.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "dark");
}
