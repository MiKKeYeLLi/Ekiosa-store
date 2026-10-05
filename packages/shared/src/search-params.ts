import { categories } from "./categories";
import type { CategorySlug, ProductQuery, SortOption } from "./types";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to high" },
  { value: "price-desc", label: "Price: High to low" },
  { value: "rating", label: "Top rated" },
];

const SORT_VALUES = new Set(SORT_OPTIONS.map((o) => o.value));
const CATEGORY_VALUES = new Set(categories.map((c) => c.slug));

type ParamsLike = { get(key: string): string | null };

function toCents(v: string | null): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
}

/** Parse listing filters from URL search params (dollar values in the URL). */
export function parseProductQuery(params: ParamsLike): ProductQuery {
  const sort = params.get("sort") as SortOption | null;
  const cats = (params.get("category") ?? "")
    .split(",")
    .filter((c): c is CategorySlug => CATEGORY_VALUES.has(c as CategorySlug));
  return {
    q: params.get("q") ?? undefined,
    categories: cats,
    minPrice: toCents(params.get("min")),
    maxPrice: toCents(params.get("max")),
    inStockOnly: params.get("instock") === "1",
    onSaleOnly: params.get("sale") === "1",
    sort: sort && SORT_VALUES.has(sort) ? sort : "featured",
  };
}

export function countActiveFilters(q: ProductQuery): number {
  return (
    (q.categories?.length ?? 0) +
    (q.minPrice != null || q.maxPrice != null ? 1 : 0) +
    (q.inStockOnly ? 1 : 0) +
    (q.onSaleOnly ? 1 : 0)
  );
}

export const PRICE_PRESETS: { label: string; min?: number; max?: number }[] = [
  { label: "Under $50", max: 50 },
  { label: "$50 – $150", min: 50, max: 150 },
  { label: "$150 – $500", min: 150, max: 500 },
  { label: "$500+", min: 500 },
];

export const POPULAR_SEARCHES = ["Headphones", "Boots", "Hoodie", "Candle", "Serum"];
