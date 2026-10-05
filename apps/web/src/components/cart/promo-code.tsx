"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { lookupPromoCode } from "@/lib/pricing";
import { useCart } from "@/lib/store/use-cart";
import { cn, sleep } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export function PromoCode() {
  const { promo, applyPromo } = useCart();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  if (promo) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-dashed border-success/40 bg-success-tint px-3.5 py-2.5">
        <div className="flex items-center gap-2 text-sm text-success">
          <Tag className="size-4" aria-hidden />
          <span>
            <span className="font-medium">{promo.code}</span> · {promo.label}
          </span>
        </div>
        <button
          type="button"
          onClick={() => applyPromo(null)}
          className="flex size-7 items-center justify-center rounded-full text-success hover:bg-white/60"
          aria-label={`Remove promo code ${promo.code}`}
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
        <Tag className="size-4" aria-hidden /> Add a promo code
      </button>
    );
  }

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (!code.trim()) {
          setError("Enter a promo code.");
          return;
        }
        setChecking(true);
        setError(null);
        await sleep(500);
        const found = lookupPromoCode(code);
        setChecking(false);
        if (found) {
          applyPromo(found);
          setCode("");
          setOpen(false);
        } else {
          setError("That code isn't valid or has expired.");
        }
      }}
    >
      <label htmlFor="promo" className="sr-only">
        Promo code
      </label>
      <div className="flex gap-2">
        <input
          id="promo"
          autoFocus
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="Promo code"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "promo-error" : "promo-hint"}
          className={cn(
            "h-11 min-w-0 flex-1 rounded-xl border bg-surface px-3.5 text-sm uppercase tracking-wide outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-faint focus:border-ink",
            error ? "border-danger" : "border-line",
          )}
        />
        <button
          type="submit"
          disabled={checking}
          className="flex h-11 min-w-20 items-center justify-center rounded-xl border border-ink px-4 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-white disabled:opacity-60"
        >
          {checking ? <Spinner className="size-4" /> : "Apply"}
        </button>
      </div>
      {error ? (
        <p id="promo-error" className="mt-2 text-[0.8125rem] text-danger" role="alert">
          {error}
        </p>
      ) : (
        <p id="promo-hint" className="mt-2 text-[0.8125rem] text-ink-muted">
          Try <span className="font-mono">WELCOME10</span> for this demo.
        </p>
      )}
    </form>
  );
}
