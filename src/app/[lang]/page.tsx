import type { CSSProperties } from "react";
import Link from "next/link";
import { assertLocale, getDictionary } from "@/i18n/get-dictionary";
import { getProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import HeroScene from "@/components/experience/HeroScene";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const lang = assertLocale((await params).lang);
  const dict = await getDictionary(lang);
  const featured = (await getProducts()).slice(0, 4);

  return (
    <>
      {/* HERO — dark, the monolith in fog. Slides under the glass header. */}
      <section className="grain relative -mt-14 flex h-[100svh] min-h-[560px] flex-col overflow-hidden bg-ink text-white">
        <HeroScene />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,5,5,0.85)_100%)]" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-4 pb-10 sm:px-6 sm:pb-14">
          <p className="intro label text-muted-dark" style={{ "--intro-delay": "900ms" } as CSSProperties}>
            {dict.home.kicker}
          </p>
          <h1
            className="intro mt-5 max-w-3xl text-[clamp(2.6rem,8vw,6.5rem)] font-extrabold uppercase leading-[0.92] tracking-tight"
            style={{ "--intro-delay": "1100ms" } as CSSProperties}
          >
            {dict.home.heroTitle}
          </h1>
          <div
            className="intro mt-8 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"
            style={{ "--intro-delay": "1400ms" } as CSSProperties}
          >
            <p className="max-w-sm text-sm leading-relaxed text-muted-dark">{dict.home.heroText}</p>
            <Link
              href={`/${lang}/shop`}
              className="label group flex w-fit items-center gap-4 border border-white/30 px-6 py-4 backdrop-blur-sm transition-colors duration-500 hover:border-white hover:bg-white hover:text-ink"
            >
              {dict.home.heroCta}
              <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* COLLECTION — white, the products get full attention. */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <Reveal className="mb-12 flex items-end justify-between gap-6 border-b border-line pb-6">
            <div>
              <p className="label text-muted">{dict.home.kicker}</p>
              <h2 className="mt-3 text-4xl font-extrabold uppercase tracking-tight sm:text-6xl">
                {dict.home.collectionTitle}
              </h2>
            </div>
            <Link href={`/${lang}/shop`} className="label shrink-0 text-muted hover:text-ink">
              {dict.home.viewAll} →
            </Link>
          </Reveal>
          <div className="grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
            {featured.map((p, i) => (
              <Reveal key={p.slug} delay={i * 90}>
                <ProductCard product={p} lang={lang} dict={dict} index={i + 1} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO — dark again, the brand voice. */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-36">
          <Reveal>
            <p className="label text-muted-dark">{dict.home.manifestoKicker}</p>
            <h2 className="mt-6 max-w-4xl text-3xl font-extrabold uppercase leading-[1.05] tracking-tight sm:text-6xl">
              {dict.home.manifestoTitle}
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-10 max-w-xl text-base leading-relaxed text-muted-dark sm:ml-auto sm:text-lg">
              {dict.home.manifesto}
            </p>
          </Reveal>
        </div>
        <div className="mx-auto grid max-w-7xl border-t border-line-dark sm:grid-cols-3">
          {dict.home.pillars.map((pillar, i) => (
            <Reveal
              key={pillar.title}
              delay={i * 120}
              className="border-line-dark px-4 py-12 sm:px-6 [&:not(:first-child)]:border-t sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:border-t-0"
            >
              <p className="label text-muted-dark">0{i + 1}</p>
              <h3 className="mt-6 text-lg font-bold uppercase tracking-wide">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-dark">{pillar.text}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
