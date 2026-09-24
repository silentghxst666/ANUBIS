import Link from "next/link";
import { assertLocale, getDictionary } from "@/i18n/get-dictionary";
import { getProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const lang = assertLocale((await params).lang);
  const dict = await getDictionary(lang);
  const featured = (await getProducts()).slice(0, 4);

  return (
    <>
      <section className="bg-ink text-paper">
        <div className="mx-auto flex min-h-[78dvh] max-w-7xl flex-col justify-end gap-8 px-4 pb-14 pt-24 sm:px-6 sm:pb-20">
          <p className="label text-muted-dark">{dict.home.heroKicker}</p>
          <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            {dict.home.heroTitle}
          </h1>
          <Link
            href={`/${lang}/shop`}
            className="label w-fit border border-paper px-6 py-4 transition-colors hover:bg-paper hover:text-ink"
          >
            {dict.home.heroCta} →
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="label">{dict.home.featured}</h2>
          <Link href={`/${lang}/shop`} className="label text-muted hover:text-ink">
            {dict.home.viewAll} →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} lang={lang} dict={dict} />
          ))}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            {dict.home.manifestoTitle}
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-muted">{dict.home.manifesto}</p>
        </div>
        <div className="mx-auto grid max-w-7xl border-t border-line sm:grid-cols-3">
          {dict.home.pillars.map((pillar, i) => (
            <div
              key={pillar.title}
              className="border-line px-4 py-10 sm:px-6 [&:not(:first-child)]:border-t sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:border-t-0"
            >
              <p className="label text-muted">0{i + 1}</p>
              <h3 className="mt-4 font-bold">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{pillar.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
