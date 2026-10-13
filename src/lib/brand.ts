import type { Metadata } from "next";

// Brand files live in public/brand (generated from the traced Eye of Horus mark).
// favicon.ico sits in src/app; Next.js links it on every page by itself.
export const BRAND_ICONS: Metadata["icons"] = {
  icon: [
    { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
  ],
  apple: [{ url: "/brand/apple-icon.png", sizes: "180x180" }],
};
