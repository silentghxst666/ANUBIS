import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionValue } from "./auth";

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionValue(store.get(SESSION_COOKIE)?.value);
}

/** Guard for admin pages and every admin Server Action. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
