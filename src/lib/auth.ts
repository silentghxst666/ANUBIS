// Admin sessions: a single shop owner, one password (ADMIN_PASSWORD in Vercel settings).
// The session cookie is "<expiry>.<hmac>" signed with a key derived from that password, so
// changing the password logs every device out. Web Crypto only — runs in the proxy too.

export const SESSION_COOKIE = "anubis_admin";
export const SESSION_DAYS = 14;

const encoder = new TextEncoder();

function toBase64Url(buffer: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function adminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD;
  return value && value.length >= 8 ? value : null;
}

export function isAdminConfigured(): boolean {
  return adminPassword() !== null;
}

async function hmac(message: string): Promise<string | null> {
  const password = adminPassword();
  if (!password) return null;
  const keyMaterial = await crypto.subtle.digest("SHA-256", encoder.encode(`anubis-session:${password}`));
  const key = await crypto.subtle.importKey("raw", keyMaterial, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toBase64Url(signature);
}

/** Constant-time string comparison (length is not secret here). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function checkPassword(candidate: string): Promise<boolean> {
  const password = adminPassword();
  if (!password) return false;
  // Compare digests so the comparison time does not depend on where the strings differ.
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(candidate)),
    crypto.subtle.digest("SHA-256", encoder.encode(password)),
  ]);
  return safeEqual(toBase64Url(a), toBase64Url(b));
}

export async function createSessionValue(): Promise<string | null> {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const signature = await hmac(String(expires));
  return signature ? `${expires}.${signature}` : null;
}

export async function verifySessionValue(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  const expected = await hmac(expires);
  return expected !== null && safeEqual(signature, expected);
}
