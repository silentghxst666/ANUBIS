import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/config";
import { assertLocale, getDictionary } from "@/i18n/get-dictionary";
import { formatPrice } from "@/lib/format";
import { getProduct, getProducts, LOW_STOCK, totalStock } from "@/lib/products";
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
  const t = dict.product;

  const views = Math.max(product.images.length, 1);
  const stock = totalStock(product);
  const status =
    stock === 0 ? t.soldOut : stock <= LOW_STOCK ? t.limited.replace("{n}", String(stock)) : t.inStock;

  const sections = [
    {
      title: t.material,
      body: (
        <p>
          {product.material[lang]}
          {product.weight && <span className="label ml-2 text-fg">{product.weight}</span>}
        </p>
      ),
    },
    {
      title: t.features,
      body: (
        <ul className="space-y-1">
          {product.features.map((f) => (
            <li key={f.en}>— {f[lang]}</li>
          ))}
        </ul>
      ),
    },
    { title: t.care, body: <p>{product.care[lang]}</p> },
    { title: t.delivery, body: <p>{t.deliveryText}</p> },
  ];

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_440px] lg:gap-16 lg:py-12">
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: views }, (_, i) => (
          <div key={i} className={views === 1 ? "sm:col-span-2" : undefined}>
            <ProductVisual
              product={product}
              index={i}
              priority={i === 0}
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
          </div>
        ))}
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <nav className="label flex gap-2 text-muted" aria-label="Breadcrumb">
          <Link href={`/${lang}/shop`} className="hover:text-fg">
            {dict.shop.title}
          </Link>
          <span>/</span>
          <span>{product.collection}</span>
        </nav>

        <h1 className="mt-6 text-2xl font-display font-medium uppercase leading-[1.15] sm:text-3xl">
          {product.name[lang]}
        </h1>
        <p className="label mt-3 text-muted">{product.sku}</p>

        <p className="mt-6 text-xl tabular-nums">{formatPrice(product.price)}</p>
        <p className="label mt-1 text-muted">{t.priceNote}</p>

        <div className="label mt-6 flex flex-wrap gap-x-6 gap-y-2">
          <span className="text-muted">
            {t.color}: <span className="text-fg">{t.colors[product.color]}</span>
          </span>
          <span className={stock <= LOW_STOCK ? "text-fg" : "text-muted"}>● {status}</span>
        </div>

        <AddToCart
          slug={product.slug}
          stock={product.stock}
          cartHref={`/${lang}/cart`}
          labels={{
            size: t.size,
            selectSize: t.selectSize,
            soldOut: t.soldOut,
            addToCart: t.addToCart,
            added: t.added,
            viewCart: t.viewCart,
          }}
        />

        <p className="mt-8 leading-relaxed text-muted">{product.description[lang]}</p>

        <div className="mt-8 border-t border-line">
          {sections.map((s, i) => (
            <details key={s.title} className="group border-b border-line" open={i === 0}>
              <summary className="label flex cursor-pointer list-none items-center justify-between py-4 [&::-webkit-details-marker]:hidden">
                {s.title}
                <span className="text-base leading-none transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="pb-5 text-sm leading-relaxed text-muted">{s.body}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
