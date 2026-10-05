"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { SearchX, SlidersHorizontal } from "lucide-react";
import { ActiveFilters, Filters, type FilterChange } from "@/components/product/filters";
import { ProductGrid } from "@/components/product/product-grid";
import { SortSelect } from "@/components/product/sort-select";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { categories } from "@/lib/data/categories";
import { countActiveFilters, parseProductQuery } from "@/lib/search-params";
import type { CategorySlug, Product, SortOption } from "@/lib/types";
import { pluralize } from "@/lib/utils";

/**
 * Products and facet counts are fetched on the server for the current URL.
 * Filter changes update the URL; the filter UI updates optimistically while
 * the server renders the new results.
 */
export function ShopView({
  paramsKey: serverParamsKey,
  products: shown,
  facetCounts,
}: {
  paramsKey: string;
  products: Product[];
  facetCounts: Partial<Record<CategorySlug, number>>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [paramsKey, setOptimisticParams] = useOptimistic(serverParamsKey);

  const query = useMemo(() => parseProductQuery(new URLSearchParams(paramsKey)), [paramsKey]);
  const activeCount = countActiveFilters(query);

  function navigate(qs: string) {
    startTransition(() => {
      setOptimisticParams(qs);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function update(change: FilterChange & { q?: string | null; sort?: SortOption }) {
    const next = new URLSearchParams(paramsKey);
    const set = (key: string, value: string | null | undefined) => (value ? next.set(key, value) : next.delete(key));
    if ("q" in change) set("q", change.q);
    if ("category" in change) set("category", change.category?.join(","));
    if ("min" in change) set("min", change.min != null ? String(change.min) : null);
    if ("max" in change) set("max", change.max != null ? String(change.max) : null);
    if ("instock" in change) set("instock", change.instock ? "1" : null);
    if ("sale" in change) set("sale", change.sale ? "1" : null);
    if ("sort" in change) set("sort", change.sort === "featured" ? null : change.sort);
    navigate(next.toString());
  }

  function clearAll() {
    navigate(query.sort && query.sort !== "featured" ? `sort=${query.sort}` : "");
  }

  const heading =
    query.q
      ? `Results for “${query.q}”`
      : query.onSaleOnly && activeCount === 1
        ? "Sale"
        : query.categories?.length === 1
          ? categories.find((c) => c.slug === query.categories![0])?.name
          : "All products";
  const subheading =
    query.categories?.length === 1 && !query.q ? categories.find((c) => c.slug === query.categories![0])?.description : undefined;

  return (
    <div className="container-page pb-8 pt-8 sm:pt-12">
      <header className="mb-8 border-b border-line pb-8 sm:mb-10">
        <nav aria-label="Breadcrumb" className="mb-4 text-[0.8125rem] text-ink-muted">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="hover:text-ink">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink-soft">
              Shop
            </li>
          </ol>
        </nav>
        <h1 className="font-display text-[2.5rem] leading-none tracking-tight text-ink sm:text-6xl">{heading}</h1>
        {subheading && <p className="mt-3 text-[0.9375rem] text-ink-muted">{subheading}</p>}
      </header>

      <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-12 xl:grid-cols-[16.5rem_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto pb-8 pr-1">
            <Filters query={query} counts={facetCounts} onChange={update} />
          </div>
        </aside>

        <section aria-label="Products" aria-busy={loading}>
          {/* Toolbar — sticky on mobile for quick access */}
          <div className="sticky top-16 z-20 -mx-4 mb-6 flex items-center gap-3 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <Button variant="outline" size="sm" className="h-10 lg:hidden" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal className="size-4" />
              Filters
              {activeCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-ink text-[0.6875rem] text-white">{activeCount}</span>
              )}
            </Button>
            <p className="hidden text-sm text-ink-muted sm:block" aria-live="polite">
              {loading ? "Updating…" : pluralize(shown.length, "product")}
            </p>
            <SortSelect value={query.sort ?? "featured"} onChange={(sort) => update({ sort })} className="ml-auto w-auto min-w-0 sm:w-56" />
          </div>

          <div className="mb-6 empty:hidden">
            <ActiveFilters query={query} onChange={update} onClearAll={clearAll} />
          </div>

          {!loading && shown.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No products found"
              description={
                query.q
                  ? `We couldn't find anything matching “${query.q}”. Try a different search or remove some filters.`
                  : "No products match these filters. Try widening your price range or removing a filter."
              }
              action={
                <Button variant="outline" onClick={() => navigate("")}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <div className={loading ? "pointer-events-none opacity-50 transition-opacity" : "transition-opacity"}>
              <ProductGrid products={shown} columns={3} priorityCount={3} />
            </div>
          )}
        </section>
      </div>

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={`Filters${activeCount ? ` (${activeCount})` : ""}`}
        side="right"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={clearAll} disabled={!activeCount}>
              Clear
            </Button>
            <Button className="flex-[2]" onClick={() => setFiltersOpen(false)} loading={loading} loadingText="Updating…">
              Show {pluralize(shown.length, "result")}
            </Button>
          </div>
        }
      >
        <div className="p-5">
          <Filters query={query} counts={facetCounts} onChange={update} />
        </div>
      </Drawer>
    </div>
  );
}
