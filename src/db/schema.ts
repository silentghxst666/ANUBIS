import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export type LocalizedText = { en: string; ru: string };
/** One size and its units in stock. Stored as a list: jsonb re-sorts object keys, lists keep S → XL order. */
export type StockEntry = { size: string; qty: number };

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  sku: text("sku").notNull(),
  collection: text("collection").notNull(),
  nameEn: text("name_en").notNull(),
  nameRu: text("name_ru").notNull(),
  descriptionEn: text("description_en").notNull().default(""),
  descriptionRu: text("description_ru").notNull().default(""),
  materialEn: text("material_en").notNull().default(""),
  materialRu: text("material_ru").notNull().default(""),
  weight: text("weight"),
  features: jsonb("features").$type<LocalizedText[]>().notNull().default([]),
  careEn: text("care_en").notNull().default(""),
  careRu: text("care_ru").notNull().default(""),
  category: text("category").notNull(),
  color: text("color").notNull(),
  /** Tenge, whole units. */
  price: integer("price").notNull(),
  /** Sizes with units in stock, in display order. */
  stock: jsonb("stock").$type<StockEntry[]>().notNull().default([]),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  isNew: boolean("is_new").notNull().default(false),
  published: boolean("published").notNull().default(true),
  /** Lower comes first in the collection. */
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;

/**
 * Idempotent DDL, run once per server process before the first query. Keeps setup to
 * "connect a database in Vercel" — no migration CLI step for the shop owner.
 */
export const CREATE_PRODUCTS_TABLE = `
  CREATE TABLE IF NOT EXISTS products (
    id serial PRIMARY KEY,
    slug text NOT NULL UNIQUE,
    sku text NOT NULL,
    collection text NOT NULL,
    name_en text NOT NULL,
    name_ru text NOT NULL,
    description_en text NOT NULL DEFAULT '',
    description_ru text NOT NULL DEFAULT '',
    material_en text NOT NULL DEFAULT '',
    material_ru text NOT NULL DEFAULT '',
    weight text,
    features jsonb NOT NULL DEFAULT '[]'::jsonb,
    care_en text NOT NULL DEFAULT '',
    care_ru text NOT NULL DEFAULT '',
    category text NOT NULL,
    color text NOT NULL,
    price integer NOT NULL,
    stock jsonb NOT NULL DEFAULT '[]'::jsonb,
    images jsonb NOT NULL DEFAULT '[]'::jsonb,
    is_new boolean NOT NULL DEFAULT false,
    published boolean NOT NULL DEFAULT true,
    position integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )
`;

/** One-row-per-flag table for set-up state (e.g. whether the demo catalog was seeded). */
export const CREATE_META_TABLE = `
  CREATE TABLE IF NOT EXISTS shop_meta (
    key text PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`;
