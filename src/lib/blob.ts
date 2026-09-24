import "server-only";

// Vercel Blob can be connected two ways:
// - "token": a long-lived BLOB_READ_WRITE_TOKEN (older stores);
// - "oidc":  BLOB_STORE_ID, authorised per request by Vercel's OIDC token (newer stores).
// Uploads and deletes work with either; the upload route picks the matching protocol.

export type BlobAuth = "token" | "oidc" | null;

export function blobAuth(): BlobAuth {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "token";
  if (process.env.BLOB_STORE_ID) return "oidc";
  return null;
}

export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const UPLOAD_MAX_BYTES = 15 * 1024 * 1024;
