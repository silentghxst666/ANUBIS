"use client";

import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { setQty, useCart } from "@/lib/cart";
import { formatPrice, toUsd } from "@/lib/format";

export type CartProduct = {
  slug: string;
  sku: string;
  name: string;
  price: number;
  color: "black" | "white";
  image?: string;
};

export default function CartView({
  lang,
  catalog,
  labels,
}: {
  lang: Locale;
  catalog: Record<string, CartProduct>;
  labels: Dictionary["cart"];
}) {
  // Items whose product was removed from the catalog are silently skipped.
  const lines = useCart().flatMap((item) =>
    catalog[item.slug] ? [{ ...item, product: catalog[item.slug] }] : [],
  );
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const subtotalUsd = lines.reduce((sum, l) => sum + toUsd(l.product.price) * l.qty, 0);

  if (lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted">{labels.empty}</p>
        <Link
          href={`/${lang}/shop`}
          className="label mt-6 inline-block border border-ink px-6 py-4 hover:bg-ink hover:text-white"
        >
          {labels.continue}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <ul className="divide-y divide-line border-y border-line">
        {lines.map(({ product, size, qty }) => (
          <li key={`${product.slug}-${size}`} className="flex gap-4 py-5">
            <Link
              href={`/${lang}/product/${product.slug}`}
              className={`relative aspect-[3/4] w-20 shrink-0 overflow-hidden sm:w-24 ${product.color === "black" ? "bg-ink-2" : "bg-fill"}`}
            >
              {product.image && (
                <Image src={product.image} alt={product.name} fill sizes="96px" className="object-cover" />
              )}
            </Link>
            <div className="flex flex-1 flex-col justify-between gap-2">
              <div className="flex justify-between gap-4">
                <div>
                  <Link href={`/${lang}/product/${product.slug}`} className="font-semibold hover:opacity-60">
                    {product.name}
                  </Link>
                  <p className="label mt-1 text-muted">
                    {product.sku} · {labels.size} {size}
                  </p>
                </div>
                <span className="text-sm tabular-nums">{formatPrice(product.price * qty, toUsd(product.price) * qty)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center border border-line">
                  <button
                    type="button"
                    className="h-9 w-9 hover:bg-fill"
                    onClick={() => setQty(product.slug, size, qty - 1)}
                    aria-label={labels.decrease}
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
                  <button
                    type="button"
                    className="h-9 w-9 hover:bg-fill"
                    onClick={() => setQty(product.slug, size, qty + 1)}
                    aria-label={labels.increase}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="label text-muted hover:text-ink"
                  onClick={() => setQty(product.slug, size, 0)}
                >
                  {labels.remove}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 ml-auto max-w-sm">
        <div className="flex justify-between text-lg font-semibold">
          <span>{labels.subtotal}</span>
          <span className="tabular-nums">{formatPrice(subtotal, subtotalUsd)}</span>
        </div>
        <p className="mt-2 text-sm text-muted">{labels.deliveryNote}</p>
        <button
          type="button"
          disabled
          className="label mt-6 h-13 w-full bg-ink text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {labels.checkout}
        </button>
        <p className="label mt-3 text-center text-muted">{labels.checkoutSoon}</p>
      </div>
    </div>
  );
}
