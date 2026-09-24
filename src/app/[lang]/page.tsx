import { Fragment, type CSSProperties } from "react";
import Link from "next/link";
import { assertLocale, getDictionary } from "@/i18n/get-dictionary";
import { getProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import HeroScene from "@/components/experience/HeroScene";
import Marquee from "@/components/Marquee";
import ScrollWords from "@/components/ScrollWords";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const lang = assertLocale((await params).lang);
  const dict = await getDictionary(lang);
  const featured = (await getProducts()).slice(0, 4);

  return (
    <>
      {/* HERO — dark, the monolith in fog. Slides under the glass header. */}
      <section className="grain relative -mt-14 flex h-[100svh] min-h-[560px] flex-col overflow-hidden border-t border-line bg-bg text-fg">
        <HeroScene />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,color-mix(in_srgb,var(--bg)_85%,transparent)_100%)]" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-4 pb-10 sm:px-6 sm:pb-14">
          <p className="intro label text-muted" style={{ "--intro-delay": "900ms" } as CSSProperties}>
            {dict.home.kicker}
          </p>
          <h1
            className="font-display mt-5 max-w-4xl font-medium text-[clamp(1.9rem,6.2vw,5rem)] uppercase leading-[1.02]"
            aria-label={dict.home.heroTitle}
          >
            {dict.home.heroTitle.split(" ").map((word, i) => (
              <Fragment key={i}>
                {i > 0 && " "}
                <span className="word" aria-hidden>
                  <span style={{ "--word-delay": `${1000 + i * 140}ms` } as CSSProperties}>{word}</span>
                </span>
              </Fragment>
            ))}
          </h1>
          <div
            className="intro mt-8 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"
            style={{ "--intro-delay": "1800ms" } as CSSProperties}
          >
            <p className="max-w-sm text-sm leading-relaxed text-muted">{dict.home.heroText}</p>
            <Link
              href={`/${lang}/shop`}
              className="label group flex w-fit items-center gap-4 border border-fg/30 px-6 py-4 backdrop-blur-sm transition-colors duration-500 hover:border-fg hover:bg-fg hover:text-bg"
            >
              {dict.home.heroCta}
              <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      <Marquee items={["Not made for everyone", "Collection 001", "Origins", "Almaty"]} />

      {/* COLLECTION — white, the products get full attention. */}
      <section className="bg-bg">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <Reveal className="mb-12 flex items-end justify-between gap-6 border-b border-line pb-6">
            <div>
              <p className="label text-muted">{dict.home.kicker}</p>
              <h2 className="font-display mt-3 text-3xl font-medium uppercase sm:text-5xl">
                {dict.home.collectionTitle}
              </h2>
            </div>
            <Link href={`/${lang}/shop`} className="label shrink-0 text-muted hover:text-fg">
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
      <section className="bg-bg text-fg">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-36">
          <Reveal>
            <p className="label text-muted">{dict.home.manifestoKicker}</p>
            <h2 className="font-display mt-6 max-w-4xl text-2xl font-medium uppercase leading-[1.15] sm:text-5xl">
              {dict.home.manifestoTitle}
            </h2>
          </Reveal>
          <ScrollWords
            text={dict.home.manifesto}
            className="mt-12 max-w-2xl text-lg leading-relaxed text-fg sm:ml-auto sm:text-2xl"
          />
        </div>
        <div className="mx-auto grid max-w-7xl border-t border-line sm:grid-cols-3">
          {dict.home.pillars.map((pillar, i) => (
            <Reveal
              key={pillar.title}
              delay={i * 120}
              className="border-line px-4 py-12 sm:px-6 [&:not(:first-child)]:border-t sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:border-t-0"
            >
              <p className="label text-muted">0{i + 1}</p>
              <h3 className="font-display mt-6 text-base font-medium uppercase">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{pillar.text}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
