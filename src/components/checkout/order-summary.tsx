import type { CartLine, OrderTotals, PromoCode } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { ProductImage } from "@/components/product/product-image";

export function OrderLines({ lines, className }: { lines: CartLine[]; className?: string }) {
  return (
    <ul className={cn("flex flex-col gap-4", className)}>
      {lines.map((l) => (
        <li key={l.productId} className="flex items-center gap-4">
          <div className="relative shrink-0">
            <ProductImage src={l.image} alt={l.name} sizes="64px" className="aspect-[4/5] w-14 rounded-lg ring-1 ring-line" />
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-muted px-1 text-[0.6875rem] font-semibold tabular-nums text-white">
              {l.quantity}
            </span>
          </div>
          <p className="min-w-0 flex-1 text-sm leading-snug text-ink">
            <span className="line-clamp-2">{l.name}</span>
            <span className="text-xs text-ink-muted tabular-nums">{formatPrice(l.unitPrice)} each</span>
          </p>
          <p className="text-sm tabular-nums text-ink">{formatPrice(l.unitPrice * l.quantity)}</p>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotalsList({
  totals,
  promo,
  shippingLabel,
  shippingPending,
}: {
  totals: OrderTotals;
  promo?: PromoCode | null;
  shippingLabel?: string;
  shippingPending?: boolean;
}) {
  return (
    <dl className="flex flex-col gap-2.5 text-sm">
      <div className="flex justify-between">
        <dt className="text-ink-muted">Subtotal</dt>
        <dd className="tabular-nums text-ink">{formatPrice(totals.subtotal)}</dd>
      </div>
      {totals.discount > 0 && (
        <div className="flex justify-between">
          <dt className="text-ink-muted">Discount{promo ? ` (${promo.code})` : ""}</dt>
          <dd className="tabular-nums text-success">−{formatPrice(totals.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-ink-muted">Shipping{shippingLabel ? ` · ${shippingLabel}` : ""}</dt>
        <dd className="tabular-nums text-ink">{shippingPending ? "—" : totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-ink-muted">Estimated tax</dt>
        <dd className="tabular-nums text-ink">{formatPrice(totals.tax)}</dd>
      </div>
      <div className="mt-2 flex items-baseline justify-between border-t border-line pt-4">
        <dt className="text-[0.9375rem] font-medium text-ink">Total</dt>
        <dd className="text-xl font-medium tabular-nums tracking-tight text-ink">
          <span className="mr-1.5 text-xs font-normal text-ink-faint">USD</span>
          {formatPrice(totals.total)}
        </dd>
      </div>
    </dl>
  );
}

export function OrderSummary({
  lines,
  totals,
  promo,
  shippingLabel,
  title = "Order summary",
  className,
}: {
  lines: CartLine[];
  totals: OrderTotals;
  promo?: PromoCode | null;
  shippingLabel?: string;
  title?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl border border-line bg-surface p-5 sm:p-7", className)}>
      <h2 className="text-lg font-medium text-ink">{title}</h2>
      <OrderLines lines={lines} className="mt-6 max-h-[22rem] overflow-y-auto pr-1 pt-2" />
      <div className="mt-6 border-t border-line pt-5">
        <OrderTotalsList totals={totals} promo={promo} shippingLabel={shippingLabel} />
      </div>
    </div>
  );
}
