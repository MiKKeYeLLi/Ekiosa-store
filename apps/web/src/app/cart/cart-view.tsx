"use client";

import { ShoppingBag } from "lucide-react";
import { CartItem } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { SectionHeader } from "@/components/home/section-header";
import { ProductGrid } from "@/components/product/product-grid";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/store/use-cart";
import type { Product } from "@/lib/types";
import { pluralize } from "@/lib/utils";

export function CartView({ recommendations }: { recommendations: Product[] }) {
  const { lines, itemCount, hydrated } = useCart();
  const inCart = new Set(lines.map((l) => l.productId));
  const recs = recommendations.filter((p) => !inCart.has(p.id)).slice(0, 4);

  if (!hydrated) return <CartSkeleton />;

  if (!lines.length) {
    return (
      <div className="container-page">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Looks like you haven't added anything yet. Explore our bestsellers or browse by category to get started."
          action={
            <>
              <ButtonLink href="/shop">Start shopping</ButtonLink>
              <ButtonLink href="/shop?sale=1" variant="outline">
                Shop the sale
              </ButtonLink>
            </>
          }
        />
        <section className="mt-8">
          <SectionHeader title="Popular right now" href="/shop" />
          <ProductGrid products={recs} />
        </section>
      </div>
    );
  }

  return (
    <div className="container-page pt-8 sm:pt-12">
      <header className="flex items-baseline justify-between gap-4 border-b border-line pb-6">
        <h1 className="font-display text-[2.5rem] leading-none tracking-tight text-ink sm:text-6xl">Your bag</h1>
        <p className="text-sm text-ink-muted">{pluralize(itemCount, "item")}</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-14 xl:grid-cols-[1fr_26rem]">
        <section aria-label="Items in your bag">
          <ul className="divide-y divide-line">
            {lines.map((line) => (
              <CartItem key={line.productId} line={line} />
            ))}
          </ul>
        </section>

        <aside className="lg:pt-6">
          <div className="lg:sticky lg:top-28">
            <CartSummary />
          </div>
        </aside>
      </div>

      {recs.length > 0 && (
        <section className="mt-24">
          <SectionHeader title="Complete the look" href="/shop" />
          <ProductGrid products={recs} />
        </section>
      )}
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="container-page pt-8 sm:pt-12" aria-busy="true" aria-label="Loading your bag">
      <div className="border-b border-line pb-6">
        <Skeleton className="h-12 w-48" />
      </div>
      <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-14 xl:grid-cols-[1fr_26rem]">
        <div className="divide-y divide-line">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-6 py-6">
              <Skeleton className="aspect-[4/5] w-24 rounded-xl sm:w-32" />
              <div className="flex flex-1 flex-col gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-auto h-9 w-28 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="mt-6 h-96 rounded-3xl" />
      </div>
    </div>
  );
}
