"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  disabled,
  label = "Quantity",
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  // Local draft lets the user clear the field while typing without snapping back.
  const [draft, setDraft] = useState(String(value));
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setDraft(String(value));
  }

  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  function commit(raw: string) {
    const n = parseInt(raw, 10);
    const next = Number.isFinite(n) ? clamp(n) : value;
    setDraft(String(next));
    if (next !== value) onChange(next);
  }

  const btn =
    "flex items-center justify-center text-ink-soft transition-colors hover:bg-subtle hover:text-ink disabled:cursor-not-allowed disabled:text-ink-faint disabled:hover:bg-transparent";
  const dims = size === "sm" ? "h-9 [&>button]:w-9" : "h-12 [&>button]:w-11";

  return (
    <div
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-full border border-line bg-surface focus-within:border-ink",
        dims,
        disabled && "opacity-50",
        className,
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
        }}
        aria-label={label}
        className={cn(
          "w-10 bg-transparent text-center text-sm font-medium tabular-nums text-ink outline-none",
          size === "md" && "w-12 text-[0.9375rem]",
        )}
      />
      <button
        type="button"
        className={btn}
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
