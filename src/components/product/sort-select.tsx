"use client";

import { ArrowUpDown, ChevronDown } from "lucide-react";
import { SORT_OPTIONS } from "@/lib/search-params";
import type { SortOption } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SortSelect({ value, onChange, className }: { value: SortOption; onChange: (v: SortOption) => void; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <label htmlFor="sort" className="sr-only">
        Sort products
      </label>
      <ArrowUpDown className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
      <select
        id="sort"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="h-10 w-full cursor-pointer appearance-none rounded-full border border-line bg-surface pl-10 pr-9 text-sm font-medium text-ink outline-none transition-colors hover:border-ink focus:border-ink"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
    </div>
  );
}
