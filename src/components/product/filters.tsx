"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";
import { Checkbox } from "@/components/ui/input";
import { categories } from "@/lib/data/categories";
import { PRICE_PRESETS } from "@/lib/search-params";
import type { CategorySlug, ProductQuery } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

export interface FilterChange {
  category?: CategorySlug[];
  min?: number | null; // dollars
  max?: number | null; // dollars
  instock?: boolean;
  sale?: boolean;
}

export function Filters({
  query,
  counts,
  onChange,
}: {
  query: ProductQuery;
  counts: Partial<Record<CategorySlug, number>>;
  onChange: (change: FilterChange) => void;
}) {
  const selected = query.categories ?? [];
  const minDollars = query.minPrice != null ? query.minPrice / 100 : undefined;
  const maxDollars = query.maxPrice != null ? query.maxPrice / 100 : undefined;

  return (
    <div className="flex flex-col divide-y divide-line">
      <FilterGroup title="Category">
        <ul className="flex flex-col gap-3">
          {categories.map((c) => {
            const checked = selected.includes(c.slug);
            return (
              <li key={c.slug} className="flex items-center justify-between gap-3">
                <Checkbox
                  label={c.name}
                  checked={checked}
                  onChange={() =>
                    onChange({ category: checked ? selected.filter((s) => s !== c.slug) : [...selected, c.slug] })
                  }
                />
                <span className="text-xs tabular-nums text-ink-faint">{counts[c.slug] ?? 0}</span>
              </li>
            );
          })}
        </ul>
      </FilterGroup>

      <FilterGroup title="Price">
        <div className="flex flex-wrap gap-2">
          {PRICE_PRESETS.map((p) => {
            const active = minDollars === p.min && maxDollars === p.max;
            return (
              <button
                key={p.label}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(active ? { min: null, max: null } : { min: p.min ?? null, max: p.max ?? null })}
                className={cn(
                  "h-9 rounded-full border px-3.5 text-[0.8125rem] transition-colors",
                  active ? "border-ink bg-ink text-white" : "border-line text-ink-soft hover:border-ink hover:text-ink",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <PriceRange
          key={`${minDollars ?? ""}-${maxDollars ?? ""}`}
          min={minDollars}
          max={maxDollars}
          onApply={(min, max) => onChange({ min, max })}
        />
      </FilterGroup>

      <FilterGroup title="Availability">
        <div className="flex flex-col gap-3">
          <Checkbox label="In stock only" checked={!!query.inStockOnly} onChange={(e) => onChange({ instock: e.target.checked })} />
          <Checkbox label="On sale" checked={!!query.onSaleOnly} onChange={(e) => onChange({ sale: e.target.checked })} />
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="py-5 first:pt-0">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-between text-sm font-medium text-ink"
        >
          {title}
          <ChevronDown className={cn("size-4 text-ink-muted transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      </h3>
      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}

function PriceRange({
  min,
  max,
  onApply,
}: {
  min?: number;
  max?: number;
  onApply: (min: number | null, max: number | null) => void;
}) {
  const [lo, setLo] = useState(min?.toString() ?? "");
  const [hi, setHi] = useState(max?.toString() ?? "");
  const loN = lo === "" ? null : Number(lo);
  const hiN = hi === "" ? null : Number(hi);
  const invalid = loN != null && hiN != null && loN > hiN;

  return (
    <form
      className="mt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!invalid) onApply(loN, hiN);
      }}
    >
      <div className="flex items-center gap-2">
        <PriceInput label="Minimum price" value={lo} onChange={setLo} placeholder="Min" invalid={invalid} />
        <span className="text-ink-faint" aria-hidden>
          –
        </span>
        <PriceInput label="Maximum price" value={hi} onChange={setHi} placeholder="Max" invalid={invalid} />
        <button
          type="submit"
          disabled={invalid}
          className="h-10 shrink-0 rounded-full border border-line px-3.5 text-[0.8125rem] font-medium text-ink transition-colors hover:border-ink disabled:opacity-40"
        >
          Go
        </button>
      </div>
      {invalid && (
        <p className="mt-2 text-[0.8125rem] text-danger" role="alert">
          Minimum must be less than maximum.
        </p>
      )}
    </form>
  );
}

function PriceInput({
  label,
  value,
  onChange,
  placeholder,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  invalid: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-10 min-w-0 flex-1 items-center rounded-xl border bg-surface px-3 transition-colors focus-within:border-ink",
        invalid ? "border-danger" : "border-line",
      )}
    >
      <span className="text-sm text-ink-faint">$</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 bg-transparent pl-1 text-sm tabular-nums outline-none placeholder:text-ink-faint"
      />
    </div>
  );
}

/** Removable chips summarising applied filters. */
export function ActiveFilters({
  query,
  onChange,
  onClearAll,
}: {
  query: ProductQuery;
  onChange: (change: FilterChange & { q?: string | null }) => void;
  onClearAll: () => void;
}) {
  const chips: { label: string; onRemove: () => void }[] = [];
  if (query.q) chips.push({ label: `“${query.q}”`, onRemove: () => onChange({ q: null }) });
  for (const slug of query.categories ?? []) {
    chips.push({
      label: categories.find((c) => c.slug === slug)?.name ?? slug,
      onRemove: () => onChange({ category: (query.categories ?? []).filter((s) => s !== slug) }),
    });
  }
  if (query.minPrice != null || query.maxPrice != null) {
    const label =
      query.minPrice != null && query.maxPrice != null
        ? `${formatPrice(query.minPrice)} – ${formatPrice(query.maxPrice)}`
        : query.minPrice != null
          ? `${formatPrice(query.minPrice)}+`
          : `Under ${formatPrice(query.maxPrice!)}`;
    chips.push({ label, onRemove: () => onChange({ min: null, max: null }) });
  }
  if (query.inStockOnly) chips.push({ label: "In stock", onRemove: () => onChange({ instock: false }) });
  if (query.onSaleOnly) chips.push({ label: "On sale", onRemove: () => onChange({ sale: false }) });

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={chip.onRemove}
          className="group inline-flex h-8 items-center gap-1.5 rounded-full bg-subtle pl-3 pr-2 text-[0.8125rem] text-ink-soft transition-colors hover:bg-muted hover:text-ink"
          aria-label={`Remove filter ${chip.label}`}
        >
          {chip.label}
          <X className="size-3.5 text-ink-muted group-hover:text-ink" />
        </button>
      ))}
      <button type="button" onClick={onClearAll} className="ml-1 text-[0.8125rem] font-medium text-ink underline underline-offset-4 hover:text-ink-soft">
        Clear all
      </button>
    </div>
  );
}
