"use client";

import Link from "next/link";
import { useState } from "react";
import { addToCart } from "@/lib/cart";

type Labels = {
  size: string;
  selectSize: string;
  soldOut: string;
  addToCart: string;
  added: string;
  viewCart: string;
};

export default function AddToCart({
  slug,
  stock,
  cartHref,
  labels,
}: {
  slug: string;
  stock: Record<string, number>;
  cartHref: string;
  labels: Labels;
}) {
  const sizes = Object.keys(stock);
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null);
  const [added, setAdded] = useState(false);
  const soldOut = sizes.every((s) => stock[s] === 0);

  function add() {
    if (!size) return;
    addToCart(slug, size);
    setAdded(true);
  }

  return (
    <div className="mt-8">
      <p className="label mb-3" id="size-label">
        {labels.size}
      </p>
      <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-labelledby="size-label">
        {sizes.map((s) => {
          const unavailable = stock[s] === 0;
          const selected = size === s;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={unavailable}
              onClick={() => {
                setSize(s);
                setAdded(false);
              }}
              className={`h-12 border text-sm transition-colors duration-300 ${
                selected
                  ? "border-ink bg-ink text-white"
                  : "border-line hover:border-ink disabled:hover:border-line"
              } disabled:cursor-not-allowed disabled:text-muted disabled:line-through`}
            >
              {s}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={add}
        disabled={soldOut || !size}
        className="label mt-4 h-14 w-full bg-ink text-white transition-opacity duration-300 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-35"
      >
        {soldOut ? labels.soldOut : size ? labels.addToCart : labels.selectSize}
      </button>

      <div aria-live="polite" className="min-h-6">
        {added && (
          <p className="label mt-3 flex items-center justify-between">
            <span>✓ {labels.added}</span>
            <Link href={cartHref} className="underline underline-offset-4 hover:opacity-60">
              {labels.viewCart} →
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
