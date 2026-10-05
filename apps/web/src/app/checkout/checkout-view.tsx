"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ShoppingBag } from "lucide-react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { OrderLines, OrderSummary, OrderTotalsList } from "@/components/checkout/order-summary";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import type { CheckoutFormValues } from "@/lib/checkout-validation";
import { computeTotals, getShippingMethod } from "@/lib/pricing";
import type { SessionUser } from "@/lib/auth/types";
import { CheckoutError, placeOrder } from "@/lib/services/orders";
import { useCart } from "@/lib/store/use-cart";
import type { ShippingMethodId } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

export function CheckoutView({ user }: { user: SessionUser }) {
  const router = useRouter();
  const { toast } = useToast();
  const { lines, promo, hydrated, clear } = useCart();
  const [shippingMethodId, setShippingMethodId] = useState<ShippingMethodId>("standard");
  const [status, setStatus] = useState<"idle" | "submitting" | "redirecting">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const method = getShippingMethod(shippingMethodId);
  const totals = computeTotals(lines, promo, method);

  async function handleSubmit(values: CheckoutFormValues, { simulateFailure }: { simulateFailure: boolean }) {
    setStatus("submitting");
    setSubmitError(null);
    try {
      const order = await placeOrder({ values, shippingMethodId, lines, promo, simulateFailure });
      setStatus("redirecting");
      router.push(`/order/${order.id}`);
      // Clear after navigation has started so the empty-bag state never flashes.
      setTimeout(clear, 400);
    } catch (err) {
      setStatus("idle");
      const message = err instanceof CheckoutError ? err.message : "Something went wrong on our side. Please try again.";
      const code = err instanceof CheckoutError ? err.code : "unknown";
      if (code === "unauthenticated") {
        // Session expired mid-checkout — re-render the page so the sign-in gate shows.
        router.refresh();
        return;
      }
      setSubmitError(message);
      toast({
        tone: "error",
        title: code === "payment_declined" ? "Payment failed" : code === "out_of_stock" ? "Stock changed" : "Order not placed",
        description: code === "out_of_stock" ? "Please review your bag." : "Your order wasn't placed. Please try again.",
        ...(code === "out_of_stock" ? { action: { label: "Review bag", href: "/cart" } } : {}),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (!hydrated) return <CheckoutSkeleton />;

  if (status === "redirecting") {
    return (
      <div className="container-page flex flex-col items-center py-32 text-center" role="status">
        <Spinner className="size-8 text-brand" />
        <p className="mt-5 text-lg font-medium text-ink">Confirming your order…</p>
        <p className="mt-1 text-sm text-ink-muted">Please don&apos;t close this window.</p>
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
    <div className="pb-16">
      {/* Mobile collapsible summary */}
      <div className="border-b border-line bg-subtle lg:hidden">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen((o) => !o)}
          aria-expanded={mobileSummaryOpen}
          aria-controls="mobile-summary"
          className="container-page flex h-14 items-center justify-between text-sm"
        >
          <span className="flex items-center gap-2 font-medium text-ink">
            <ShoppingBag className="size-4" aria-hidden />
            {mobileSummaryOpen ? "Hide" : "Show"} order summary
            <ChevronDown className={cn("size-4 transition-transform", mobileSummaryOpen && "rotate-180")} aria-hidden />
          </span>
          <span className="text-base font-medium tabular-nums text-ink">{formatPrice(totals.total)}</span>
        </button>
        {mobileSummaryOpen && (
          <div id="mobile-summary" className="container-page animate-fade-in pb-6 pt-2">
            <OrderLines lines={lines} className="pt-2" />
            <div className="mt-6 border-t border-line pt-5">
              <OrderTotalsList totals={totals} promo={promo} shippingLabel={method.name} />
            </div>
          </div>
        )}
      </div>

      <div className="container-page pt-8 sm:pt-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_24rem] lg:gap-16 xl:grid-cols-[1fr_28rem] xl:gap-24">
          <div className="min-w-0">
            <nav aria-label="Checkout progress" className="mb-8 text-[0.8125rem] text-ink-muted">
              <ol className="flex items-center gap-2">
                <li>
                  <Link href="/cart" className="hover:text-ink">
                    Bag
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li aria-current="step" className="font-medium text-ink">
                  Checkout
                </li>
                <li aria-hidden>/</li>
                <li>Confirmation</li>
              </ol>
            </nav>
            <h1 className="mb-10 font-display text-[2.5rem] leading-none tracking-tight text-ink sm:text-5xl">Checkout</h1>
            <CheckoutForm
              user={user}
              shippingMethodId={shippingMethodId}
              onShippingMethodChange={setShippingMethodId}
              discountedSubtotal={totals.subtotal - totals.discount}
              total={totals.total}
              submitting={status === "submitting"}
              submitError={submitError}
              onDismissError={() => setSubmitError(null)}
              onSubmit={handleSubmit}
            />
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <OrderSummary lines={lines} totals={totals} promo={promo} shippingLabel={method.name} />
              <p className="mt-4 text-center text-[0.8125rem] text-ink-muted">
                Need to make changes?{" "}
                <Link href="/cart" className="font-medium text-ink underline underline-offset-4">
                  Edit bag
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="container-page pt-8 sm:pt-12" aria-busy="true" aria-label="Loading checkout">
      <div className="grid gap-12 lg:grid-cols-[1fr_24rem] lg:gap-16 xl:grid-cols-[1fr_28rem] xl:gap-24">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mb-6 h-12 w-56" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="mt-8 h-6 w-48" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <Skeleton className="hidden h-[28rem] rounded-3xl lg:block" />
      </div>
    </div>
  );
}
