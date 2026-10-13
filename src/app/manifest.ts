import type { MetadataRoute } from "next";

// "Add to home screen" on Android / desktop: name, colours and the sigil icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ANUBIS",
    short_name: "ANUBIS",
    description: "ANUBIS — designer technical apparel. Not made for everyone.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
