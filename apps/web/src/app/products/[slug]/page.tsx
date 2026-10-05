import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { SectionHeader } from "@/components/home/section-header";
import { AccordionItem } from "@/components/product/product-info-accordion";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductPurchase } from "@/components/product/product-purchase";
import { StockStatus } from "@/components/product/stock-status";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { getCategoryName } from "@/lib/data/categories";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { getAllProductSlugs, getProductBySlug, getRelatedProducts } from "@/lib/services/catalog";
import { formatPrice } from "@/lib/utils";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getAllProductSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return { title: product.name, description: product.shortDescription };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product, 4);
  const categoryName = getCategoryName(product.category);

  return (
    <div className="container-page pt-6 sm:pt-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-[0.8125rem] text-ink-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-ink">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/shop?category=${product.category}`} className="hover:text-ink">
              {categoryName}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="max-w-[16rem] truncate text-ink-soft">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14 xl:gap-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-ink-muted">{product.brand}</p>
            {product.tags.includes("new") && <Badge tone="brand">New</Badge>}
            {product.tags.includes("bestseller") && <Badge>Bestseller</Badge>}
            {product.tags.includes("limited") && <Badge tone="warning">Limited edition</Badge>}
          </div>
          <h1 className="mt-3 font-display text-[2.25rem] leading-[1.05] tracking-tight text-ink sm:text-5xl">{product.name}</h1>

          <a href="#details" className="mt-4 self-start">
            <Rating value={product.rating} count={product.reviewCount} size="md" />
          </a>

          <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" showDiscount className="mt-6" />
          <p className="mt-1 text-[0.8125rem] text-ink-muted">
            Taxes calculated at checkout.{" "}
            {product.price >= FREE_SHIPPING_THRESHOLD ? "Ships free." : `Free shipping on orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)}.`}
          </p>

          <p className="mt-6 text-base leading-relaxed text-ink-soft">{product.shortDescription}</p>

          <StockStatus stock={product.stock} className="mt-6" />

          <div className="mt-4">
            <ProductPurchase product={product} />
          </div>

          <ul className="mt-8 grid gap-3 rounded-2xl bg-subtle p-5 text-sm text-ink-soft">
            <li className="flex items-center gap-3">
              <Truck className="size-4.5 shrink-0 text-ink" strokeWidth={1.75} aria-hidden />
              Delivery in 4–6 business days, or next day with express
            </li>
            <li className="flex items-center gap-3">
              <RotateCcw className="size-4.5 shrink-0 text-ink" strokeWidth={1.75} aria-hidden />
              Free returns within 30 days
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4.5 shrink-0 text-ink" strokeWidth={1.75} aria-hidden />
              Covered by our 2-year warranty
            </li>
          </ul>

          <div id="details" className="mt-8 scroll-mt-28 border-t border-line">
            <AccordionItem title="Description" defaultOpen>
              <p>{product.description}</p>
              <ul className="mt-4 flex flex-col gap-2">
                {product.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-ink-soft">
                    <Check className="mt-1 size-4 shrink-0 text-brand" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
            </AccordionItem>
            <AccordionItem title="Product details">
              <dl className="divide-y divide-line">
                {[{ label: "Category", value: getCategoryName(product.category) }, ...product.details, { label: "SKU", value: product.id.toUpperCase() }].map((d) => (
                  <div key={d.label} className="grid grid-cols-[8rem_1fr] gap-4 py-2.5 text-sm">
                    <dt className="text-ink-muted">{d.label}</dt>
                    <dd className="text-ink-soft">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </AccordionItem>
            <AccordionItem title="Shipping & returns">
              <p>
                Standard delivery is free on orders over {formatPrice(FREE_SHIPPING_THRESHOLD)} and arrives in 4–6 business days. Express
                (2–3 days) and next-day options are available at checkout. Returns are free within 30 days of delivery — items must be
                unused and in original packaging.
              </p>
            </AccordionItem>
            <AccordionItem title={`Reviews (${product.reviewCount.toLocaleString("en-US")})`}>
              <div className="flex items-center gap-4">
                <p className="font-display text-5xl text-ink">{product.rating.toFixed(1)}</p>
                <div>
                  <Rating value={product.rating} size="md" />
                  <p className="mt-1 text-sm">Based on {product.reviewCount.toLocaleString("en-US")} verified reviews</p>
                </div>
              </div>
            </AccordionItem>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24" aria-labelledby="related-heading">
          <SectionHeader title={<span id="related-heading">You may also like</span>} href={`/shop?category=${product.category}`} linkLabel={`More ${categoryName}`} />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
