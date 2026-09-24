import type { Metadata } from "next";
import { assertLocale, getDictionary } from "@/i18n/get-dictionary";
import { getProducts } from "@/lib/products";
import CartView, { type CartProduct } from "@/components/CartView";

export async function generateMetadata({ params }: PageProps<"/[lang]/cart">): Promise<Metadata> {
  const dict = await getDictionary(assertLocale((await params).lang));
  return { title: dict.cart.title, robots: { index: false } };
}

export default async function CartPage({ params }: PageProps<"/[lang]/cart">) {
  const lang = assertLocale((await params).lang);
  const dict = await getDictionary(lang);

  // The cart lives in the browser; send it just enough catalog data to render lines.
  // Prices are re-checked on the server at checkout (stage 3), never trusted from the client.
  const catalog: Record<string, CartProduct> = Object.fromEntries(
    (await getProducts()).map((p) => [
      p.slug,
      { slug: p.slug, sku: p.sku, name: p.name[lang], price: p.price, color: p.color, image: p.images[0] },
    ]),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-medium uppercase sm:text-6xl">{dict.cart.title}</h1>
      <CartView lang={lang} catalog={catalog} labels={dict.cart} />
    </div>
  );
}
