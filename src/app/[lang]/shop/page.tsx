import type { Metadata } from "next";
import Link from "next/link";
import { assertLocale, getDictionary } from "@/i18n/get-dictionary";
import { categories, getProducts, isCategory } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export async function generateMetadata({ params }: PageProps<"/[lang]/shop">): Promise<Metadata> {
  const dict = await getDictionary(assertLocale((await params).lang));
  return { title: dict.shop.title };
}

export default async function Shop({ params, searchParams }: PageProps<"/[lang]/shop">) {
  const lang = assertLocale((await params).lang);
  const dict = await getDictionary(lang);
  const c = (await searchParams).c;
  const active = typeof c === "string" && isCategory(c) ? c : undefined;
  const products = await getProducts(active);

  const tab = (selected: boolean) =>
    `label whitespace-nowrap border-b pb-1 ${selected ? "border-ink" : "border-transparent text-muted hover:text-ink"}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{dict.shop.title}</h1>
        <span className="label text-muted tabular-nums">
          {products.length} {dict.shop.items}
        </span>
      </div>

      <nav className="-mx-4 mt-8 flex gap-6 overflow-x-auto [scrollbar-width:none] border-b border-line px-4 pb-3 sm:mx-0 sm:px-0">
        <Link href={`/${lang}/shop`} className={tab(!active)}>
          {dict.shop.all}
        </Link>
        {categories.map((cat) => (
          <Link key={cat} href={`/${lang}/shop?c=${cat}`} className={tab(active === cat)}>
            {dict.shop.categories[cat]}
          </Link>
        ))}
      </nav>

      {products.length === 0 ? (
        <p className="py-24 text-center text-muted">{dict.shop.empty}</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} lang={lang} dict={dict} />
          ))}
        </div>
      )}
    </div>
  );
}
