"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { ProductImage } from "@/components/product/product-image";
import { QuantitySelector } from "@/components/product/quantity-selector";
import { useToast } from "@/components/ui/toast";
import { getCategoryName } from "@/lib/data/categories";
import { useCart } from "@/lib/store/use-cart";
import type { CartLine } from "@/lib/types";
import { formatPrice, LOW_STOCK_THRESHOLD } from "@/lib/utils";

export function CartItem({ line }: { line: CartLine }) {
  const { setQuantity, remove, restore } = useCart();
  const { toast } = useToast();
  const onSale = line.compareAtPrice != null && line.compareAtPrice > line.unitPrice;
  const href = `/products/${line.slug}`;

  function handleRemove() {
    const removed = remove(line.productId);
    if (!removed) return;
    toast({
      tone: "info",
      title: "Removed from bag",
      description: removed.name,
      image: removed.image,
      action: { label: "Undo", onClick: () => restore(removed) },
      duration: 6000,
    });
  }

  return (
    <li className="flex gap-4 py-6 sm:gap-6">
      <Link href={href} className="shrink-0">
        <ProductImage src={line.image} alt={line.name} sizes="128px" className="aspect-[4/5] w-24 rounded-xl sm:w-32" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-ink-muted">{getCategoryName(line.category)}</p>
            <h3 className="mt-0.5 text-[0.9375rem] font-medium leading-snug text-ink">
              <Link href={href} className="hover:underline hover:underline-offset-4">
                {line.name}
              </Link>
            </h3>
            <p className="mt-1 text-sm tabular-nums text-ink-muted">
              {formatPrice(line.unitPrice)}
              {onSale && <s className="ml-2 text-ink-faint">{formatPrice(line.compareAtPrice!)}</s>}
            </p>
          </div>
          <p className="shrink-0 text-[0.9375rem] font-medium tabular-nums text-ink">{formatPrice(line.unitPrice * line.quantity)}</p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <QuantitySelector
            size="sm"
            value={line.quantity}
            max={line.maxQuantity}
            onChange={(q) => setQuantity(line.productId, q)}
            label={`Quantity for ${line.name}`}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] text-ink-muted transition-colors hover:bg-danger-tint hover:text-danger"
          >
            <Trash2 className="size-4" aria-hidden />
            Remove
          </button>
        </div>
        {line.maxQuantity <= LOW_STOCK_THRESHOLD && (
          <p className="mt-2 text-xs font-medium text-warning">
            {line.quantity >= line.maxQuantity ? `Max quantity reached — only ${line.maxQuantity} in stock` : `Only ${line.maxQuantity} left in stock`}
          </p>
        )}
      </div>
    </li>
  );
}
