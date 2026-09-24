"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";

type Labels = {
  size: string;
  selectSize: string;
  soldOut: string;
  addToCart: string;
  added: string;
};

export default function AddToCart({
  slug,
  stock,
  labels,
}: {
  slug: string;
  stock: Record<string, number>;
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
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="mt-6">
      <p className="label mb-2">{labels.size}</p>
      <div className="grid grid-cols-4 gap-2">
        {sizes.map((s) => {
          const unavailable = stock[s] === 0;
          const selected = size === s;
          return (
            <button
              key={s}
              type="button"
              disabled={unavailable}
              onClick={() => setSize(s)}
              aria-pressed={selected}
              className={`h-11 border text-sm transition-colors ${
                selected
                  ? "border-ink bg-ink text-paper"
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
        className="label mt-4 h-13 w-full bg-ink text-paper transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {soldOut ? labels.soldOut : added ? `✓ ${labels.added}` : size ? labels.addToCart : labels.selectSize}
      </button>
    </div>
  );
}
