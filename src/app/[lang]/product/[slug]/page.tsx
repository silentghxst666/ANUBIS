import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/config";
import { assertLocale, getDictionary } from "@/i18n/get-dictionary";
import { formatPrice } from "@/lib/format";
import { getProduct, getProducts } from "@/lib/products";
import ProductVisual from "@/components/ProductVisual";
import AddToCart from "@/components/AddToCart";

export async function generateStaticParams() {
  const products = await getProducts();
  return locales.flatMap((lang) => products.map((p) => ({ lang, slug: p.slug })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/product/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  const locale = assertLocale(lang);
  return { title: product.name[locale], description: product.description[locale] };
}

export default async function ProductPage({ params }: PageProps<"/[lang]/product/[slug]">) {
  const { lang: rawLang, slug } = await params;
  const lang = assertLocale(rawLang);
  const product = await getProduct(slug);
  if (!product) notFound();
  const dict = await getDictionary(lang);
  const views = Math.max(product.images.length, 1);

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_420px] lg:gap-14 lg:py-12">
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: views }, (_, i) => (
          <ProductVisual
            key={i}
            product={product}
            index={i}
            priority={i === 0}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
          />
        ))}
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="label text-muted">{product.sku}</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{product.name[lang]}</h1>
        <p className="mt-2 text-lg tabular-nums">{formatPrice(product.price)}</p>

        <p className="label mt-6 text-muted">
          {dict.product.color}: <span className="text-ink">{dict.product.colors[product.color]}</span>
        </p>

        <AddToCart
          slug={product.slug}
          stock={product.stock}
          labels={{
            size: dict.product.size,
            selectSize: dict.product.selectSize,
            soldOut: dict.product.soldOut,
            addToCart: dict.product.addToCart,
            added: dict.product.added,
          }}
        />
        <p className="label mt-3 text-muted">{dict.product.localDelivery}</p>

        <div className="mt-10 border-t border-line pt-6">
          <h2 className="label">{dict.product.details}</h2>
          <p className="mt-3 leading-relaxed text-muted">{product.description[lang]}</p>
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <h2 className="label">{dict.product.features}</h2>
          <ul className="mt-3 divide-y divide-line">
            {product.features.map((f) => (
              <li key={f.en} className="flex gap-3 py-2 text-sm">
                <span className="text-muted">—</span>
                {f[lang]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
