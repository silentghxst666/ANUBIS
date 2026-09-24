import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product photos uploaded from the admin live in Vercel Blob.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  // The embedded dev database ships WebAssembly; load it from node_modules as-is.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
