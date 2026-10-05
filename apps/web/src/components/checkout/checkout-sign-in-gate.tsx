"use client";

import Link from "next/link";
import { Lock, Package, ShoppingBag, Zap } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { computeTotals, getShippingMethod } from "@/lib/pricing";
import { useCart } from "@/lib/store/use-cart";
import { pluralize } from "@/lib/utils";
import { OrderLines, OrderTotalsList } from "./order-summary";

/** Shown at /checkout when signed out — Google sign-in is required to place an order. */
export function CheckoutSignInGate() {
  const { lines, promo, hydrated, itemCount } = useCart();
  const method = getShippingMethod("standard");
  const totals = computeTotals(lines, promo, method);

  if (!hydrated) {
    return (
      <div className="container-page pt-12">
        <Skeleton className="mx-auto h-96 max-w-md rounded-3xl" />
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="container-page">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Add a few things to your bag before checking out."
          action={<ButtonLink href="/shop">Continue shopping</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="container-page pb-16 pt-8 sm:pt-12">
      <div className="grid gap-12 lg:grid-cols-[1fr_24rem] lg:gap-16 xl:grid-cols-[1fr_28rem] xl:gap-24">
        <div className="max-w-lg">
          <nav aria-label="Checkout progress" className="mb-8 text-[0.8125rem] text-ink-muted">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/cart" className="hover:text-ink">
                  Bag
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="step" className="font-medium text-ink">
                Sign in
              </li>
              <li aria-hidden>/</li>
              <li>Checkout</li>
            </ol>
          </nav>

          <h1 className="font-display text-[2.5rem] leading-none tracking-tight text-ink sm:text-5xl">Sign in to check out</h1>
          <p className="mt-4 text-base leading-relaxed text-ink-muted">
            We use your Google account to keep your orders secure and send your confirmation. Your bag ({pluralize(itemCount, "item")}) is
            saved and will be right here when you return.
          </p>

          <div className="mt-8 rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8">
            <GoogleSignInButton next="/checkout" variant="primary" />
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
              <Lock className="size-3.5" aria-hidden /> We only receive your name, email and profile photo.
            </p>
          </div>

          <ul className="mt-8 grid gap-4 text-sm text-ink-muted">
            <li className="flex items-center gap-3">
              <Zap className="size-4 text-brand" aria-hidden /> Your email and name are filled in for you
            </li>
            <li className="flex items-center gap-3">
              <Package className="size-4 text-brand" aria-hidden /> Track this order from your account
            </li>
          </ul>
        </div>

        <aside className="rounded-3xl border border-line bg-surface p-5 sm:p-7 lg:self-start">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-medium text-ink">Order summary</h2>
            <Link href="/cart" className="text-[0.8125rem] font-medium text-ink underline underline-offset-4">
              Edit bag
            </Link>
          </div>
          <OrderLines lines={lines} className="mt-6 max-h-[22rem] overflow-y-auto pr-1 pt-2" />
          <div className="mt-6 border-t border-line pt-5">
            <OrderTotalsList totals={totals} promo={promo} shippingLabel={method.name} />
          </div>
          <p className="mt-3 text-xs text-ink-faint">Estimated with standard shipping. You can choose a faster option at checkout.</p>
        </aside>
      </div>
    </div>
  );
}
