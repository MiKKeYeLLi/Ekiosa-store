"use client";

import Link from "next/link";
import { ArrowRight, Lock, RotateCcw, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { computeTotals, FREE_SHIPPING_THRESHOLD, getShippingMethod } from "@/lib/pricing";
import { useCart } from "@/lib/store/use-cart";
import { formatPrice } from "@/lib/utils";
import { PromoCode } from "./promo-code";

export function FreeShippingProgress({ amount }: { amount: number }) {
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - amount, 0);
  const pct = Math.min((amount / FREE_SHIPPING_THRESHOLD) * 100, 100);
  return (
    <div>
      <p className="flex items-center gap-2 text-sm text-ink-soft">
        <Truck className="size-4 shrink-0 text-brand" aria-hidden />
        {remaining > 0 ? (
          <span>
            You&apos;re <span className="font-medium text-ink">{formatPrice(remaining)}</span> away from free shipping
          </span>
        ) : (
          <span className="font-medium text-success">You&apos;ve unlocked free standard shipping</span>
        )}
      </p>
      <div
        className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label="Progress toward free shipping"
      >
        <div className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CartSummary() {
  const { lines, promo, savings } = useCart();
  const standard = getShippingMethod("standard");
  const totals = computeTotals(lines, promo, standard, { includeTax: false });
  const discounted = totals.subtotal - totals.discount;

  return (
    <div className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-7">
      <h2 className="text-lg font-medium text-ink">Order summary</h2>

      <div className="mt-5">
        <FreeShippingProgress amount={discounted} />
      </div>

      <dl className="mt-6 flex flex-col gap-3 border-t border-line pt-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-muted">Subtotal</dt>
          <dd className="tabular-nums text-ink">{formatPrice(totals.subtotal)}</dd>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between">
            <dt className="text-ink-muted">Promo ({promo?.code})</dt>
            <dd className="tabular-nums text-success">−{formatPrice(totals.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-ink-muted">Shipping estimate</dt>
          <dd className="tabular-nums text-ink">{totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-muted">Tax</dt>
          <dd className="text-ink-muted">Calculated at checkout</dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-line pt-5">
        <PromoCode />
      </div>

      <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
        <span className="text-[0.9375rem] font-medium text-ink">Estimated total</span>
        <span className="text-2xl font-medium tabular-nums tracking-tight text-ink">{formatPrice(totals.total)}</span>
      </div>
      {savings + totals.discount > 0 && (
        <p className="mt-1 text-right text-[0.8125rem] font-medium text-sale">You&apos;re saving {formatPrice(savings + totals.discount)}</p>
      )}

      <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">
        <Lock className="size-4" /> Checkout
      </ButtonLink>
      <Link
        href="/shop"
        className="group mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
      >
        Continue shopping <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>

      <ul className="mt-6 flex flex-col gap-2 border-t border-line pt-5 text-[0.8125rem] text-ink-muted">
        <li className="flex items-center gap-2">
          <RotateCcw className="size-3.5" aria-hidden /> Free 30-day returns
        </li>
        <li className="flex items-center gap-2">
          <Lock className="size-3.5" aria-hidden /> Secure, encrypted checkout
        </li>
      </ul>
    </div>
  );
}
