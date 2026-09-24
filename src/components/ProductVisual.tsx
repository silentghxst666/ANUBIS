import Image from "next/image";
import type { Product } from "@/lib/products";

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
          {/* Small monolith: echoes the hero object until photography exists. */}
          <div
            aria-hidden
            className={`sheen mx-auto h-[42%] w-[16%] ${dark ? "bg-gradient-to-r from-[#1a1a1a] via-[#262626] to-[#141414] shadow-[0_0_60px_rgba(255,255,255,0.04)]" : "bg-gradient-to-r from-[#d6d6d6] via-[#f7f7f7] to-[#cfcfcf] shadow-[0_20px_50px_rgba(0,0,0,0.08)]"}`}
          />
          <span className="label opacity-50">{product.collection}</span>
        </div>
      )}
    </div>
  );
}
