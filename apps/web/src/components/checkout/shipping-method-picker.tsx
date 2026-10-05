"use client";

import { SHIPPING_METHODS, getShippingCost } from "@/lib/pricing";
import type { ShippingMethodId } from "@/lib/types";
import { addBusinessDays, cn, formatPrice } from "@/lib/utils";

function deliveryWindow(minDays: number, maxDays: number) {
  const now = new Date();
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const from = addBusinessDays(now, minDays);
  const to = addBusinessDays(now, maxDays);
  return minDays === maxDays ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
}

export function ShippingMethodPicker({
  value,
  onChange,
  subtotal,
  disabled,
}: {
  value: ShippingMethodId;
  onChange: (id: ShippingMethodId) => void;
  subtotal: number;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Delivery method" className="flex flex-col gap-3">
      {SHIPPING_METHODS.map((m) => {
        const selected = value === m.id;
        const cost = getShippingCost(m, subtotal);
        return (
          <label
            key={m.id}
            className={cn(
              "flex cursor-pointer items-center gap-4 rounded-2xl border bg-surface p-4 transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand sm:p-5",
              selected ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]" : "border-line hover:border-line-strong",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input
              type="radio"
              name="shipping-method"
              value={m.id}
              checked={selected}
              disabled={disabled}
              onChange={() => onChange(m.id)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                selected ? "border-ink bg-ink" : "border-line-strong",
              )}
              aria-hidden
            >
              {selected && <span className="size-2 rounded-full bg-white" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.9375rem] font-medium text-ink">
                {m.name} <span className="font-normal text-ink-muted">· {m.description}</span>
              </span>
              <span className="mt-0.5 block text-[0.8125rem] text-ink-muted" suppressHydrationWarning>
                Arrives {deliveryWindow(m.minDays, m.maxDays)}
              </span>
            </span>
            <span className={cn("text-sm font-medium tabular-nums", cost === 0 ? "text-success" : "text-ink")}>
              {cost === 0 ? "Free" : formatPrice(cost)}
            </span>
          </label>
        );
      })}
    </div>
  );
}
