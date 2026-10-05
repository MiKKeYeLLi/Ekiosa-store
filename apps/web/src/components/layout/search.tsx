"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Search as SearchIcon, X } from "lucide-react";
import { ProductImage } from "@/components/product/product-image";
import { getCategoryName } from "@/lib/data/categories";
import { searchProductsAction } from "@/app/actions/search";
import { POPULAR_SEARCHES } from "@/lib/search-params";
import type { Product } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

/**
 * Search combobox with instant product suggestions.
 * Submitting navigates to the listing page with `?q=`.
 */
export function Search({
  autoFocus,
  onNavigate,
  variant = "inline",
  className,
}: {
  autoFocus?: boolean;
  onNavigate?: () => void;
  variant?: "inline" | "panel";
  className?: string;
}) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const [found, setFound] = useState<{ q: string; products: Product[] }>({ q: "", products: [] });
  const trimmed = query.trim();
  const results = found.q === trimmed ? found.products : [];
  const searching = trimmed.length > 0 && found.q !== trimmed;

  // Debounced server search; ignores responses for stale queries.
  useEffect(() => {
    if (!trimmed) return;
    let cancelled = false;
    const t = setTimeout(() => {
      searchProductsAction(trimmed)
        .then((products) => !cancelled && setFound({ q: trimmed, products }))
        .catch(() => !cancelled && setFound({ q: trimmed, products: [] }));
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [trimmed]);
  const showPanel = variant === "panel" || (open && query.trim().length > 0);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submit(q = query) {
    const term = q.trim();
    setOpen(false);
    inputRef.current?.blur();
    onNavigate?.();
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
  }

  function goToProduct(slug: string) {
    setOpen(false);
    setQuery("");
    onNavigate?.();
    router.push(`/products/${slug}`);
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (highlight >= 0 && results[highlight]) goToProduct(results[highlight].slug);
          else submit();
        }}
      >
        <label htmlFor={`${listId}-input`} className="sr-only">
          Search products
        </label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input
            ref={inputRef}
            id={`${listId}-input`}
            type="search"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={highlight >= 0 ? `${listId}-opt-${highlight}` : undefined}
            autoComplete="off"
            placeholder="Search products"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHighlight(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
                setHighlight((h) => Math.min(h + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => Math.max(h - 1, -1));
              } else if (e.key === "Escape") {
                setOpen(false);
                setHighlight(-1);
              }
            }}
            className={cn(
              "w-full rounded-full border border-transparent bg-subtle pl-10 pr-10 text-sm text-ink placeholder:text-ink-muted outline-none transition-[background-color,border-color,box-shadow] hover:bg-muted focus:border-line-strong focus:bg-surface focus:ring-4 focus:ring-ink/5 [&::-webkit-search-cancel-button]:hidden",
              variant === "panel" ? "h-12 text-base" : "h-10",
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-muted hover:text-ink"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </form>

      {showPanel && (
        <div
          className={cn(
            variant === "inline" &&
              "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 min-w-[22rem] animate-fade-in rounded-2xl border border-line bg-surface p-2 shadow-pop",
            variant === "panel" && "mt-4",
          )}
        >
          {query.trim() ? (
            searching ? (
              <p className="px-3 py-6 text-center text-sm text-ink-muted" role="status">
                Searching…
              </p>
            ) : results.length ? (
              <>
                <ul id={listId} role="listbox" aria-label="Suggestions">
                  {results.map((p, i) => (
                    <li key={p.id} id={`${listId}-opt-${i}`} role="option" aria-selected={i === highlight}>
                      <Link
                        href={`/products/${p.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          goToProduct(p.slug);
                        }}
                        onMouseEnter={() => setHighlight(i)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl p-2 transition-colors",
                          i === highlight ? "bg-subtle" : "hover:bg-subtle",
                        )}
                      >
                        <ProductImage src={p.images[0]?.src} alt="" sizes="48px" className="size-12 shrink-0 rounded-lg" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                          <span className="block text-xs text-ink-muted">{getCategoryName(p.category)}</span>
                        </span>
                        <span className="text-sm tabular-nums text-ink-soft">{formatPrice(p.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => submit()}
                  className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-subtle"
                >
                  See all results for “{query.trim()}”
                  <ArrowUpRight className="size-4" />
                </button>
              </>
            ) : (
              <div className="px-3 py-6 text-center">
                <p className="text-sm font-medium text-ink">No matches for “{query.trim()}”</p>
                <p className="mt-1 text-[0.8125rem] text-ink-muted">Try a different word, or browse a popular search below.</p>
                <PopularSearches onPick={submit} className="mt-4 justify-center" />
              </div>
            )
          ) : (
            <div className="px-1 py-1">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">Popular searches</p>
              <PopularSearches onPick={submit} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PopularSearches({ onPick, className }: { onPick: (q: string) => void; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {POPULAR_SEARCHES.map((term) => (
        <button
          key={term}
          type="button"
          onClick={() => onPick(term)}
          className="h-8 rounded-full border border-line px-3.5 text-[0.8125rem] text-ink-soft transition-colors hover:border-ink hover:text-ink"
        >
          {term}
        </button>
      ))}
    </div>
  );
}
