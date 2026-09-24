import "server-only";
import { asc, eq } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { getDatabase, schema } from "@/db";
import type { NewProductRow, ProductRow } from "@/db/schema";
import { DEMO_PRODUCTS } from "./demo-products";

// The catalog the storefront reads. Products live in the database (managed at /admin);
// without a database the built-in demo catalog is shown instead.

export type Category = "outerwear" | "tops" | "bottoms" | "accessories";
export type Color = "black" | "white";
export type Localized = Record<Locale, string>;

export type Product = {
  /** Database id; absent for the built-in demo catalog. */
  id?: number;
  slug: string;
  sku: string;
  /** Collection label, e.g. "001 / ORIGINS". */
  collection: string;
  name: Localized;
  description: Localized;
  /** Main fabric composition. */
  material: Localized;
  /** Fabric weight, e.g. "480 GSM". */
  weight?: string;
  features: Localized[];
  care: Localized;
  category: Category;
  color: Color;
  /** Price in tenge (KZT), whole units. The $ price shown next to it is derived. */
  price: number;
  /** Size -> units in stock, in display order. */
  stock: Record<string, number>;
  /** Image URLs (Vercel Blob, or /uploads/... in local development). Empty = placeholder. */
  images: string[];
  isNew?: boolean;
  /** Hidden from the storefront while false. */
  published: boolean;
  /** Lower comes first in the collection. */
  position: number;
};

export const categories: Category[] = ["outerwear", "tops", "bottoms", "accessories"];
export const colors: Color[] = ["black", "white"];

/** At or below this many units a product is shown as "limited". */
export const LOW_STOCK = 3;

export function isCategory(value: string | undefined): value is Category {
  return categories.includes(value as Category);
}

export function isColor(value: string | undefined): value is Color {
  return colors.includes(value as Color);
}

export function totalStock(product: Pick<Product, "stock">): number {
  return Object.values(product.stock).reduce((a, b) => a + b, 0);
}

export function fromRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    collection: row.collection,
    name: { en: row.nameEn, ru: row.nameRu },
    description: { en: row.descriptionEn, ru: row.descriptionRu },
    material: { en: row.materialEn, ru: row.materialRu },
    weight: row.weight ?? undefined,
    features: row.features,
    care: { en: row.careEn, ru: row.careRu },
    category: isCategory(row.category) ? row.category : "tops",
    color: isColor(row.color) ? row.color : "black",
    price: row.price,
    stock: Object.fromEntries(row.stock.map((e) => [e.size, e.qty])),
    images: row.images,
    isNew: row.isNew,
    published: row.published,
    position: row.position,
  };
}

export function toRow(p: Product): Omit<NewProductRow, "id"> {
  return {
    slug: p.slug,
    sku: p.sku,
    collection: p.collection,
    nameEn: p.name.en,
    nameRu: p.name.ru,
    descriptionEn: p.description.en,
    descriptionRu: p.description.ru,
    materialEn: p.material.en,
    materialRu: p.material.ru,
    weight: p.weight ?? null,
    features: p.features,
    careEn: p.care.en,
    careRu: p.care.ru,
    category: p.category,
    color: p.color,
    price: p.price,
    stock: Object.entries(p.stock).map(([size, qty]) => ({ size, qty })),
    images: p.images,
    isNew: p.isNew ?? false,
    published: p.published,
    position: p.position,
  };
}

/** Database handle with the demo catalog seeded on first use; null without a database. */
export async function catalogDb() {
  const ready = await getDatabase();
  if (!ready) return null;
  if (ready.fresh) {
    ready.fresh = false;
    await ready.db.insert(schema.products).values(DEMO_PRODUCTS.map(toRow)).onConflictDoNothing();
  }
  return ready.db;
}

/** Every product, including unpublished ones (admin). */
export async function getAllProducts(): Promise<Product[]> {
  const db = await catalogDb();
  if (!db) return DEMO_PRODUCTS;
  const rows = await db.select().from(schema.products).orderBy(asc(schema.products.position), asc(schema.products.id));
  return rows.map(fromRow);
}

/** Published products for the storefront, optionally one category. */
export async function getProducts(category?: Category): Promise<Product[]> {
  const all = (await getAllProducts()).filter((p) => p.published);
  return category ? all.filter((p) => p.category === category) : all;
}

/** A published product by slug (storefront). */
export async function getProduct(slug: string): Promise<Product | undefined> {
  const db = await catalogDb();
  if (!db) return DEMO_PRODUCTS.find((p) => p.slug === slug);
  const [row] = await db.select().from(schema.products).where(eq(schema.products.slug, slug)).limit(1);
  return row?.published ? fromRow(row) : undefined;
}
