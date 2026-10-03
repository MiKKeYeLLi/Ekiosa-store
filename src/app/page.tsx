import Link from "next/link";
import { ArrowRight, RotateCcw, ShieldCheck, Star, Truck } from "lucide-react";
import { SectionHeader } from "@/components/home/section-header";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductImage } from "@/components/product/product-image";
import { ButtonLink } from "@/components/ui/button";
import { unsplash } from "@/lib/data/images";
import { getBestsellers, getCategories, getCategoryCounts, getNewArrivals, getProductBySlug } from "@/lib/services/catalog";
import { formatPrice } from "@/lib/utils";

// Re-read the catalog at most once a minute so prices and stock stay fresh.
export const revalidate = 60;

export default async function HomePage() {
  const [bestsellers, newArrivals, heroProduct, categories, counts] = await Promise.all([
    getBestsellers(8),
    getNewArrivals(4),
    getProductBySlug("arlo-three-seat-velvet-sofa"),
    getCategories(),
    getCategoryCounts(),
  ]);

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="container-page pt-6 sm:pt-10">
        <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
          <div className="flex flex-col justify-center py-6 lg:py-16">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">The Autumn Edit · 2026</p>
            <h1 className="mt-5 font-display text-[3.25rem] leading-[0.95] tracking-[-0.02em] text-ink sm:text-7xl xl:text-[5.5rem]">
              Fewer, better <em className="text-brand">things.</em>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-muted sm:text-lg">
              Thoughtfully made apparel, home goods and everyday essentials — designed to be used, loved and kept for years.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/shop" size="lg">
                Shop the collection <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="/shop?sort=newest" size="lg" variant="outline">
                New arrivals
              </ButtonLink>
            </div>
            <dl className="mt-12 flex gap-10 border-t border-line pt-6 text-sm">
              <div>
                <dt className="text-ink-muted">Customer rating</dt>
                <dd className="mt-1 flex items-center gap-1 font-medium text-ink">
                  <Star className="size-4 fill-current" strokeWidth={0} /> 4.8 / 5
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Orders shipped</dt>
                <dd className="mt-1 font-medium text-ink">120k+</dd>
              </div>
              <div className="hidden sm:block">
                <dt className="text-ink-muted">Carbon-neutral</dt>
                <dd className="mt-1 font-medium text-ink">Since 2021</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <ProductImage
              src={unsplash("1586023492125-27b2c045efd7")}
              alt="A calm, minimal living room with a mustard armchair and framed art"
              sizes="(min-width: 1024px) 55vw, 100vw"
              priority
              className="aspect-[4/5] rounded-[1.75rem] sm:aspect-[16/11] lg:aspect-auto lg:h-full lg:min-h-[36rem]"
            />
            {heroProduct && (
              <Link
                href={`/products/${heroProduct.slug}`}
                className="group absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl bg-surface/95 p-3 shadow-pop backdrop-blur transition-transform hover:-translate-y-0.5 sm:bottom-6 sm:left-6 sm:right-auto sm:w-80"
              >
                <ProductImage src={heroProduct.images[0].src} alt="" sizes="64px" className="size-16 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ink-muted">Featured</p>
                  <p className="truncate text-sm font-medium text-ink">{heroProduct.name}</p>
                  <p className="text-sm tabular-nums text-sale">
                    {formatPrice(heroProduct.price)}{" "}
                    {heroProduct.compareAtPrice && <s className="text-ink-faint">{formatPrice(heroProduct.compareAtPrice)}</s>}
                  </p>
                </div>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ─── Value props ──────────────────────────────────── */}
      <section className="container-page mt-16" aria-label="Why shop with us">
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
          {[
            { icon: Truck, title: "Free shipping", text: "On orders over $100" },
            { icon: RotateCcw, title: "30-day returns", text: "Free and easy" },
            { icon: ShieldCheck, title: "2-year warranty", text: "On every product" },
            { icon: Star, title: "Rated 4.8/5", text: "From 40k+ reviews" },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-center gap-3 bg-surface px-4 py-5 sm:px-6">
              <Icon className="size-5 shrink-0 text-brand" strokeWidth={1.75} aria-hidden />
              <div>
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="text-xs text-ink-muted sm:text-[0.8125rem]">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── Categories ───────────────────────────────────── */}
      <section className="mt-24">
        <div className="container-page">
          <SectionHeader eyebrow="Browse" title="Shop by category" href="/shop" linkLabel="Shop all" />
        </div>
        <ul className="no-scrollbar container-page flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-6 lg:overflow-visible">
          {categories.map((c) => (
            <li key={c.slug} className="w-[42vw] shrink-0 snap-start sm:w-[28vw] lg:w-auto">
              <Link href={`/shop?category=${c.slug}`} className="group block">
                <ProductImage
                  src={c.image}
                  alt=""
                  sizes="(min-width: 1024px) 15vw, 42vw"
                  className="aspect-[3/4] rounded-2xl"
                  imgClassName="group-hover:scale-[1.04]"
                />
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <span className="text-[0.9375rem] font-medium text-ink group-hover:underline group-hover:underline-offset-4">{c.name}</span>
                  <span className="text-xs tabular-nums text-ink-faint">{counts[c.slug] ?? 0}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── Bestsellers ──────────────────────────────────── */}
      <section className="container-page mt-24">
        <SectionHeader
          eyebrow="Most loved"
          title="Bestsellers"
          description="The pieces our customers come back for, again and again."
          href="/shop?sort=rating"
        />
        <ProductGrid products={bestsellers} />
        <div className="mt-10 sm:hidden">
          <ButtonLink href="/shop" variant="outline" className="w-full">
            View all products
          </ButtonLink>
        </div>
      </section>

      {/* ─── Promo ────────────────────────────────────────── */}
      <section className="container-page mt-24">
        <div className="grid overflow-hidden rounded-[1.75rem] bg-brand text-white lg:grid-cols-2">
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/70">Limited time</p>
            <h2 className="mt-4 font-display text-[2.5rem] leading-[1.02] tracking-tight sm:text-6xl">
              The Autumn Sale — up to 25% off.
            </h2>
            <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-white/75">
              Outerwear, audio and home favourites, marked down for the season. New customers take an extra 10% with code{" "}
              <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.8125rem] text-white">WELCOME10</span>.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/shop?sale=1" size="lg" className="bg-white text-ink hover:bg-canvas">
                Shop the sale <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          </div>
          <ProductImage
            src={unsplash("1532453288672-3a27e9be9efd")}
            alt="A clothing rail with jackets and knitwear"
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="aspect-[4/3] lg:aspect-auto lg:min-h-[30rem]"
          />
        </div>
      </section>

      {/* ─── New arrivals ─────────────────────────────────── */}
      <section className="container-page mt-24">
        <SectionHeader eyebrow="Just landed" title="New arrivals" href="/shop?sort=newest" />
        <ProductGrid products={newArrivals} />
      </section>

      {/* ─── Reviews ──────────────────────────────────────── */}
      <section className="container-page mt-24" aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="sr-only">
          Customer reviews
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {[
            { quote: "The hoodie is the softest thing I own. Ordered a second colour within a week.", name: "Priya S.", product: "Brushed Fleece Hoodie" },
            { quote: "Arrived in two days, beautifully packed. The cups are even nicer in person.", name: "Daniel O.", product: "Stoneware Cup Set of 4" },
            { quote: "Best headphones I've owned at any price. The noise cancelling is genuinely great.", name: "Mara K.", product: "Studio Over-Ear Wireless" },
          ].map((r) => (
            <li key={r.name} className="flex flex-col rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <div className="flex gap-0.5 text-ink" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" strokeWidth={0} />
                ))}
              </div>
              <blockquote className="mt-5 flex-1 font-display text-2xl leading-snug tracking-tight text-ink">“{r.quote}”</blockquote>
              <p className="mt-6 text-sm text-ink-muted">
                <span className="font-medium text-ink">{r.name}</span> · {r.product}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
