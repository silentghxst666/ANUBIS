import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { databaseMode, schema } from "@/db";
import { requireAdmin } from "@/lib/admin-session";
import { blobAuth } from "@/lib/blob";
import { catalogDb, fromRow, type Product } from "@/lib/products";
import ProductForm from "@/components/admin/ProductForm";
import { deleteProduct } from "../../actions";

export const metadata = { title: "Товар" };

const EMPTY: Product = {
  slug: "",
  sku: "",
  collection: "001 / ORIGINS",
  name: { en: "", ru: "" },
  description: { en: "", ru: "" },
  material: { en: "", ru: "" },
  features: [],
  care: { en: "", ru: "" },
  category: "tops",
  color: "black",
  price: 0,
  stock: { S: 0, M: 0, L: 0, XL: 0 },
  images: [],
  isNew: true,
  published: false,
  position: 0,
};

export default async function EditProduct({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const db = await catalogDb();
  if (!db) notFound();

  let product = EMPTY;
  if (id !== "new") {
    const numeric = Number(id);
    if (!Number.isInteger(numeric)) notFound();
    const [row] = await db.select().from(schema.products).where(eq(schema.products.id, numeric)).limit(1);
    if (!row) notFound();
    product = fromRow(row);
  }

  // Local development without Blob stores files in public/uploads instead.
  const auth = blobAuth();
  const upload = auth ? (`blob-${auth}` as const) : databaseMode === "local" ? "local" : "none";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/admin" className="label text-muted hover:text-fg">
        ← Все товары
      </Link>
      <h1 className="mt-6 text-2xl font-semibold">{product.id ? product.name.ru : "Новый товар"}</h1>

      <ProductForm product={product} upload={upload} />

      {product.id && (
        <form action={deleteProduct} className="mt-16 border-t border-line pt-8">
          <input type="hidden" name="id" value={product.id} />
          <p className="text-sm text-muted">Удаление нельзя отменить. Чтобы убрать товар временно, просто скройте его.</p>
          <button className="label mt-4 border border-red-700 px-5 py-3 text-red-700 hover:bg-red-700 hover:text-white">
            Удалить товар
          </button>
        </form>
      )}
    </div>
  );
}
