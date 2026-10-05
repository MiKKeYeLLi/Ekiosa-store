"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCart } from "@/lib/store/use-cart";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type State = "idle" | "adding" | "added";

/** Shared add-to-cart behaviour: stock clamping, feedback toast, brief success state. */
function useAddToCart(product: Product) {
  const { add, lines } = useCart();
  const { toast } = useToast();
  const [state, setState] = useState<State>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const inCart = lines.find((l) => l.productId === product.id)?.quantity ?? 0;
  const remaining = Math.max(product.stock - inCart, 0);

  async function addToCart(quantity = 1) {
    if (state === "adding") return;
    setState("adding");
    // Small delay so the interaction feels deliberate (and mirrors a future network call).
    await new Promise((r) => setTimeout(r, 350));
    const added = add(product, quantity);
    if (added === 0) {
      setState("idle");
      toast({
        tone: "error",
        title: "No more available",
        description: `You already have all ${product.stock} in your bag.`,
        action: { label: "View bag", href: "/cart" },
      });
      return;
    }
    setState("added");
    toast({
      title: "Added to your bag",
      description: added < quantity ? `${added} × ${product.name} (limited stock)` : `${added} × ${product.name}`,
      image: product.images[0]?.src,
      action: { label: "View bag", href: "/cart" },
    });
    timer.current = setTimeout(() => setState("idle"), 1800);
  }

  return { state, addToCart, remaining, inCart };
}

export function AddToCartButton({
  product,
  quantity = 1,
  className,
}: {
  product: Product;
  quantity?: number;
  className?: string;
}) {
  const { state, addToCart, remaining } = useAddToCart(product);
  const soldOut = product.stock <= 0;
  const maxedOut = !soldOut && remaining <= 0;

  return (
    <Button
      size="lg"
      className={cn("w-full", state === "added" && "bg-success hover:bg-success", className)}
      onClick={() => addToCart(quantity)}
      disabled={soldOut || maxedOut}
      loading={state === "adding"}
      loadingText="Adding…"
    >
      {soldOut ? (
        "Sold out"
      ) : maxedOut ? (
        "All available stock in bag"
      ) : state === "added" ? (
        <>
          <Check className="size-4.5" /> Added to bag
        </>
      ) : (
        <>
          <ShoppingBag className="size-4.5" /> Add to bag
        </>
      )}
    </Button>
  );
}

/** Compact circular "quick add" used on product cards. */
export function QuickAddButton({ product, className }: { product: Product; className?: string }) {
  const { state, addToCart, remaining } = useAddToCart(product);
  if (product.stock <= 0) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(1);
      }}
      disabled={state === "adding" || remaining <= 0}
      aria-label={`Add ${product.name} to bag`}
      className={cn(
        "flex h-10 items-center justify-center gap-1.5 rounded-full bg-surface/95 px-3.5 text-sm font-medium text-ink shadow-raised backdrop-blur transition-[background-color,color,transform,opacity] duration-150 hover:bg-ink hover:text-white active:scale-95 disabled:opacity-60",
        state === "added" && "bg-success text-white hover:bg-success",
        className,
      )}
    >
      {state === "adding" ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
      ) : state === "added" ? (
        <Check className="size-4" />
      ) : (
        <Plus className="size-4" />
      )}
      <span className="hidden sm:inline">{state === "added" ? "Added" : "Quick add"}</span>
    </button>
  );
}
