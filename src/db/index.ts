import "server-only";
import { sql } from "drizzle-orm";
import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Production: Neon Postgres over HTTP (Vercel → Storage → Neon sets DATABASE_URL).
// Local development without DATABASE_URL: an embedded Postgres (PGlite) stored in .data/,
// so the admin panel can be tried end to end without any cloud account.
// Production without DATABASE_URL: no database — the storefront shows the built-in catalog.

export type Database = NeonHttpDatabase<typeof schema>;

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
const isDev = process.env.NODE_ENV === "development";

export const databaseMode: "neon" | "local" | "none" = url ? "neon" : isDev ? "local" : "none";

type Ready = {
  db: Database;
  /** True only the very first time this database is set up (used to seed the demo catalog). */
  fresh: boolean;
};
let ready: Promise<Ready> | null = null;

async function connect(): Promise<Ready> {
  let db: Database;
  if (databaseMode === "neon") {
    db = drizzleNeon(url!, { schema });
  } else {
    const [{ PGlite }, { drizzle }, { mkdir }] = await Promise.all([
      import("@electric-sql/pglite"),
      import("drizzle-orm/pglite"),
      import("node:fs/promises"),
    ]);
    // PGlite creates its own folder but not the parent.
    await mkdir(".data", { recursive: true });
    // Same query-builder API as neon-http; only the transport differs.
    db = drizzle({ client: new PGlite(".data/pglite"), schema }) as unknown as Database;
  }

  await db.execute(sql.raw(schema.CREATE_PRODUCTS_TABLE));
  await db.execute(sql.raw(schema.CREATE_META_TABLE));
  // Inserting the marker succeeds exactly once per database, which makes seeding idempotent
  // even if several server instances start at the same time.
  const marker = await db.execute(
    sql`INSERT INTO shop_meta (key) VALUES ('initialised') ON CONFLICT DO NOTHING RETURNING key`,
  );
  return { db, fresh: marker.rows.length > 0 };
}

/** The database, with the schema ensured. Null when the site runs without one. */
export async function getDatabase(): Promise<Ready | null> {
  if (databaseMode === "none") return null;
  ready ??= connect().catch((error) => {
    ready = null; // let the next request retry instead of caching the failure
    throw error;
  });
  return ready;
}

export { schema };
