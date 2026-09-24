import Image from "next/image";
import type { CSSProperties } from "react";
import type { Product } from "@/lib/products";

const SIGIL_MASK: CSSProperties = {
  maskImage: "url(/brand/anubis-eye.svg)",
  WebkitMaskImage: "url(/brand/anubis-eye.svg)",
  maskSize: "contain",
  WebkitMaskSize: "contain",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
};

/** Product photo, or a monochrome "object" placeholder until real photos are uploaded. */
export default function ProductVisual({
  product,
  index = 0,
  priority = false,
  sizes = "(min-width: 1024px) 25vw, 50vw",
}: {
  product: Product;
  index?: number;
  priority?: boolean;
  sizes?: string;
}) {
  const src = product.images[index];
  const dark = product.color === "black";

  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden ${dark ? "bg-ink-2 text-white" : "bg-fill text-ink"}`}
    >
      {src ? (
        <Image
          src={src}
          alt={product.name.en}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          <span className="label opacity-50">{product.sku}</span>
          {/* The ANUBIS sigil, faint, until photography exists. Masked to the mark's shape
              so the drifting sheen lights only the sigil, not a box around it. */}
          <div
            aria-hidden
            className={`sheen mx-auto aspect-square w-[46%] ${dark ? "bg-white/20" : "bg-black/15"}`}
            style={SIGIL_MASK}
          />
          <span className="label opacity-50">{product.collection}</span>
        </div>
      )}
    </div>
  );
}
