import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { formatPrice } from "@/lib/format";
import { LOW_STOCK, totalStock, type Product } from "@/lib/products";
import ProductVisual from "./ProductVisual";

export default function ProductCard({
  product,
  lang,
  dict,
  index,
}: {
  product: Product;
  lang: Locale;
  dict: Dictionary;
  /** Position in the collection, shown as "01", "02"… */
  index?: number;
}) {
  const stock = totalStock(product);
  const status =
    stock === 0
      ? dict.product.soldOut
      : stock <= LOW_STOCK
        ? dict.product.limited.replace("{n}", String(stock))
        : product.isNew
          ? dict.product.new
          : null;

  return (
    <Link href={`/${lang}/product/${product.slug}`} className="group block" data-cursor="view">
      <div className="relative overflow-hidden">
        <div className="transition-transform duration-[1200ms] ease-[var(--ease-weight)] group-hover:scale-[1.03]">
          <ProductVisual product={product} />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-3">
        {index !== undefined && (
          <span className="label text-muted tabular-nums">{String(index).padStart(2, "0")}</span>
        )}
        <h3 className="text-sm font-semibold uppercase tracking-wide">{product.name[lang]}</h3>
      </div>
      <p className="mt-1 text-sm tabular-nums">{formatPrice(product.price)}</p>
      <p className="label mt-2 text-muted">
        {dict.product.colors[product.color]}
        {status && <span className="text-ink"> · {status}</span>}
      </p>
    </Link>
  );
}
