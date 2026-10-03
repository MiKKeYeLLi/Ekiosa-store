import { CreditCard, Lock } from "lucide-react";
import { Checkbox } from "@/components/ui/input";

/**
 * Visual stand-in for the payment step. No card data is collected.
 * Replace the inner panel with Stripe's Payment Element (or a redirect
 * to Stripe Checkout) when payments are integrated.
 */
export function PaymentPlaceholder({
  simulateFailure,
  onSimulateFailureChange,
  disabled,
}: {
  simulateFailure: boolean;
  onSimulateFailureChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const field = "flex h-12 items-center rounded-xl border border-line bg-subtle px-3.5 text-[0.9375rem] text-ink-faint select-none";
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <span className="flex items-center gap-2.5 text-[0.9375rem] font-medium text-ink">
          <CreditCard className="size-4.5" aria-hidden /> Card
        </span>
        <span className="flex items-center gap-1.5">
          {["VISA", "MC", "AMEX"].map((b) => (
            <span key={b} className="rounded border border-line px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-wide text-ink-muted">
              {b}
            </span>
          ))}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div aria-hidden className="grid gap-3 opacity-80">
          <div className={field}>1234 1234 1234 1234</div>
          <div className="grid grid-cols-2 gap-3">
            <div className={field}>MM / YY</div>
            <div className={field}>CVC</div>
          </div>
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand-tint px-3.5 py-3 text-[0.8125rem] leading-relaxed text-brand">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Payment processing isn&apos;t connected in this preview. No card details are collected — placing an order creates a
          demo order only.
        </p>
        <Checkbox
          className="mt-4"
          label="Simulate a declined payment"
          description="Demo only — use this to preview the checkout error state."
          checked={simulateFailure}
          disabled={disabled}
          onChange={(e) => onSimulateFailureChange(e.target.checked)}
        />
      </div>
    </div>
  );
}
