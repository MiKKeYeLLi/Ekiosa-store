import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { getCategoryName } from "@/lib/data/categories";
import type { Product } from "@/lib/types";
import { cn, discountPercent, getStockStatus } from "@/lib/utils";
import { QuickAddButton } from "./add-to-cart-button";
import { ProductImage } from "./product-image";
import { StockStatus } from "./stock-status";

export function ProductCard({ product, priority, className }: { product: Product; priority?: boolean; className?: string }) {
  const pct = discountPercent(product.price, product.compareAtPrice);
  const status = getStockStatus(product.stock);
  const soldOut = status === "out_of_stock";
  const secondImage = product.images[1];

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative">
      <Link
        href={`/products/${product.slug}`}
        className="relative block overflow-hidden rounded-2xl focus-visible:outline-offset-4"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductImage
          src={product.images[0]?.src}
          alt={product.images[0]?.alt ?? product.name}
          sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"
          priority={priority}
          className="aspect-[4/5] rounded-2xl"
          imgClassName={cn("group-hover:scale-[1.03]", soldOut && "grayscale-[35%] opacity-80!")}
        />
        {secondImage && (
          <ProductImage
            src={secondImage.src}
            alt=""
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"
            className="absolute! inset-0 rounded-2xl opacity-0 transition-opacity duration-500 [@media(hover:hover)]:group-hover:opacity-100"
          />
        )}

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {soldOut ? (
            <Badge tone="inverse">Sold out</Badge>
          ) : pct > 0 ? (
            <Badge tone="sale">−{pct}%</Badge>
          ) : product.tags.includes("new") ? (
            <Badge className="bg-surface text-ink shadow-card">New</Badge>
          ) : product.tags.includes("bestseller") ? (
            <Badge className="bg-surface text-ink shadow-card">Bestseller</Badge>
          ) : null}
        </div>
      </Link>

      {!soldOut && (
        <QuickAddButton
          product={product}
          className="absolute bottom-3 right-3 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100 [@media(hover:none)]:translate-y-0! [@media(hover:none)]:opacity-100!"
        />
      )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 pt-3.5">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">{getCategoryName(product.category)}</p>
        <h3 className="line-clamp-2 text-[0.9375rem] font-medium leading-snug text-ink">
          <Link href={`/products/${product.slug}`} className="hover:underline hover:decoration-line-strong hover:underline-offset-4">
            {product.name}
          </Link>
        </h3>
        <Rating value={product.rating} count={product.reviewCount} />
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-1">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
          <StockStatus stock={product.stock} hideInStock className="text-xs" />
        </div>
      </div>
    </article>
  );
}
