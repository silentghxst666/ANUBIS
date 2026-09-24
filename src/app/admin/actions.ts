"use server";

import { eq, ne, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del } from "@vercel/blob";
import { schema } from "@/db";
import { SESSION_COOKIE, SESSION_DAYS, checkPassword, createSessionValue } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-session";
import { catalogDb, isCategory, isColor, toRow, type Product } from "@/lib/products";

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

// ---------------------------------------------------------------- session

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const password = String(form.get("password") ?? "");
  if (!(await checkPassword(password))) {
    // A small fixed delay makes guessing slower without locking the owner out.
    await new Promise((r) => setTimeout(r, 700));
    return { error: "Неверный пароль" };
  }
  const value = await createSessionValue();
  if (!value) return { error: "Пароль администратора не настроен" };
  (await cookies()).set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

// ---------------------------------------------------------------- products

/** Rebuild every storefront page that could show products. */
function refreshStorefront() {
  revalidatePath("/[lang]", "layout");
  revalidatePath("/admin");
}

async function database() {
  const db = await catalogDb();
  if (!db) throw new Error("База данных не подключена");
  return db;
}

/** Deletes uploaded files that are no longer referenced. Local /uploads files are kept. */
async function removeImages(urls: string[]) {
  const blobs = urls.filter((u) => u.includes(".blob.vercel-storage.com"));
  if (blobs.length && process.env.BLOB_READ_WRITE_TOKEN) {
    await del(blobs).catch(() => {
      // A leftover file costs almost nothing; never fail the save because of it.
    });
  }
}

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

function parseProduct(form: FormData): { product?: Product; fieldErrors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const slug = text(form, "slug").toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errors.slug = "Только латиница, цифры и дефисы, например storm-parka";

  const nameEn = text(form, "nameEn");
  const nameRu = text(form, "nameRu");
  if (!nameEn) errors.nameEn = "Введите название на английском";
  if (!nameRu) errors.nameRu = "Введите название на русском";

  const price = Number(text(form, "price").replace(/\s/g, ""));
  if (!Number.isInteger(price) || price <= 0) errors.price = "Цена в тенге — целое число больше нуля";

  const category = text(form, "category");
  const color = text(form, "color");
  if (!isCategory(category)) errors.category = "Выберите категорию";
  if (!isColor(color)) errors.color = "Выберите цвет";

  const sizes = form.getAll("size").map((v) => String(v).trim().toUpperCase());
  const quantities = form.getAll("qty").map((v) => Number(v));
  const stock: Record<string, number> = {};
  sizes.forEach((size, i) => {
    if (!size) return;
    if (size in stock) errors.stock = `Размер ${size} указан дважды`;
    const qty = quantities[i];
    if (!Number.isInteger(qty) || qty < 0) errors.stock = `Остаток для ${size} — целое число от 0`;
    stock[size] = qty;
  });
  if (Object.keys(stock).length === 0) errors.stock = "Добавьте хотя бы один размер (для аксессуаров — OS)";

  const featuresEn = form.getAll("featureEn").map((v) => String(v).trim());
  const featuresRu = form.getAll("featureRu").map((v) => String(v).trim());
  const features = featuresEn
    .map((en, i) => ({ en, ru: featuresRu[i] ?? "" }))
    .filter((f) => f.en || f.ru);

  const images = form
    .getAll("image")
    .map((v) => String(v))
    .filter((u) => u.startsWith("https://") || u.startsWith("/uploads/"));

  if (Object.keys(errors).length) return { fieldErrors: errors };

  return {
    fieldErrors: errors,
    product: {
      slug,
      sku: text(form, "sku") || slug.toUpperCase(),
      collection: text(form, "collection") || "001 / ORIGINS",
      name: { en: nameEn, ru: nameRu },
      description: { en: text(form, "descriptionEn"), ru: text(form, "descriptionRu") },
      material: { en: text(form, "materialEn"), ru: text(form, "materialRu") },
      weight: text(form, "weight") || undefined,
      features,
      care: { en: text(form, "careEn"), ru: text(form, "careRu") },
      category: category as Product["category"],
      color: color as Product["color"],
      price,
      stock,
      images,
      isNew: form.get("isNew") === "on",
      published: form.get("published") === "on",
      position: Number(text(form, "position")) || 0,
    },
  };
}

export async function saveProduct(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const { product, fieldErrors } = parseProduct(form);
  if (!product) return { error: "Проверьте отмеченные поля", fieldErrors };

  const db = await database();
  const idValue = Number(form.get("id"));
  const id = Number.isInteger(idValue) && idValue > 0 ? idValue : null;

  const clash = await db
    .select({ id: schema.products.id })
    .from(schema.products)
    .where(id ? and(eq(schema.products.slug, product.slug), ne(schema.products.id, id)) : eq(schema.products.slug, product.slug))
    .limit(1);
  if (clash.length) return { error: "Проверьте отмеченные поля", fieldErrors: { slug: "Такой адрес уже занят другим товаром" } };

  if (id) {
    const [before] = await db.select({ images: schema.products.images }).from(schema.products).where(eq(schema.products.id, id));
    await db
      .update(schema.products)
      .set({ ...toRow(product), updatedAt: new Date() })
      .where(eq(schema.products.id, id));
    if (before) await removeImages(before.images.filter((u) => !product.images.includes(u)));
  } else {
    await db.insert(schema.products).values(toRow(product));
  }

  refreshStorefront();
  redirect("/admin?saved=1");
}

export async function deleteProduct(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return;
  const db = await database();
  const [row] = await db.delete(schema.products).where(eq(schema.products.id, id)).returning({ images: schema.products.images });
  if (row) await removeImages(row.images);
  refreshStorefront();
  redirect("/admin");
}

export async function setPublished(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return;
  const db = await database();
  await db
    .update(schema.products)
    .set({ published: form.get("published") === "true", updatedAt: new Date() })
    .where(eq(schema.products.id, id));
  refreshStorefront();
}
