import Image from "next/image";
import type { Product } from "@/lib/products";

/** Product photo, or a monochrome technical placeholder until real photos are uploaded. */
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
      className={`relative aspect-[3/4] w-full overflow-hidden ${dark ? "bg-fill-dark text-paper" : "bg-fill text-ink"}`}
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
          <span className="label opacity-60">{product.sku}</span>
          <div
            aria-hidden
            className={`mx-auto aspect-square w-1/3 rounded-full border ${dark ? "border-line-dark" : "border-line"}`}
          />
          <span className="label opacity-60">ANUBIS / {product.category}</span>
        </div>
      )}
    </div>
  );
}
