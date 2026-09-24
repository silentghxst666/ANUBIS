import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { formatPrice } from "@/lib/format";
import { totalStock, type Product } from "@/lib/products";
import ProductVisual from "./ProductVisual";

export default function ProductCard({
  product,
  lang,
  dict,
}: {
  product: Product;
  lang: Locale;
  dict: Dictionary;
}) {
  const soldOut = totalStock(product) === 0;

  return (
    <Link href={`/${lang}/product/${product.slug}`} className="group block">
      <div className="relative">
        <ProductVisual product={product} />
        <div className="absolute inset-0 bg-ink/0 transition-colors group-hover:bg-ink/5" />
      </div>
      <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <h3 className="text-sm font-semibold">{product.name[lang]}</h3>
        <span className="whitespace-nowrap text-sm tabular-nums">{formatPrice(product.price)}</span>
      </div>
      <p className="label mt-1 text-muted">
        {soldOut ? dict.product.soldOut : dict.product.colors[product.color]}
        {product.isNew && <span className="text-ink"> · {dict.product.new}</span>}
      </p>
    </Link>
  );
}
