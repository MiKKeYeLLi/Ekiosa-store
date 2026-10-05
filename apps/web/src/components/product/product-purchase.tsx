"use client";

import { useEffect, useRef, useState } from "react";
import { Price } from "@/components/ui/price";
import { useCart } from "@/lib/store/use-cart";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";
import { QuantitySelector } from "./quantity-selector";

/**
 * Quantity + add-to-cart block for the product page, with a sticky
 * mobile purchase bar that appears once the main button scrolls away.
 */
export function ProductPurchase({ product }: { product: Product }) {
  const { lines } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [showSticky, setShowSticky] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const inCart = lines.find((l) => l.productId === product.id)?.quantity ?? 0;
  const remaining = Math.max(product.stock - inCart, 0);
  const soldOut = product.stock <= 0;
  const max = Math.max(1, remaining);
  const qty = Math.min(quantity, max);

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={anchorRef} className="flex flex-col gap-3">
        {!soldOut && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-soft">Quantity</span>
            {inCart > 0 && <span className="text-[0.8125rem] text-ink-muted">{inCart} already in your bag</span>}
          </div>
        )}
        <div className="flex gap-3">
          {!soldOut && <QuantitySelector value={qty} onChange={setQuantity} max={max} disabled={remaining <= 0} />}
          <AddToCartButton product={product} quantity={qty} className="flex-1" />
        </div>
        {soldOut && (
          <p className="text-[0.8125rem] text-ink-muted">This item is currently sold out. Check back soon — we restock most items within 3 weeks.</p>
        )}
      </div>

      {/* Mobile sticky purchase bar */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-300 lg:hidden",
          showSticky ? "translate-y-0" : "translate-y-full",
        )}
        aria-hidden={!showSticky}
        inert={!showSticky}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{product.name}</p>
            <Price price={product.price} compareAtPrice={product.compareAtPrice} />
          </div>
          <AddToCartButton product={product} quantity={qty} className="h-11! w-auto! px-5" />
        </div>
      </div>
    </>
  );
}
