/**
 * Catalog service — the single entry point the UI uses to read products.
 * Backed by Supabase (`products` / `categories` tables, public read via RLS).
 */
import "server-only";
import { categories as staticCategories } from "../data/categories";
import { createPublicClient } from "../supabase/public";
import { PRODUCT_COLUMNS, toCategory, toProduct, type CategoryRow, type ProductRow } from "../supabase/mappers";
import type { Category, CategorySlug, Product, ProductQuery, SortOption } from "../types";

const db = () => createPublicClient();

/** Split a search string into safe terms for PostgREST `ilike` filters. */
function searchTerms(q: string): string[] {
  return q
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}-]/gu, ""))
    .filter(Boolean)
    .slice(0, 6);
}

type Result = { data: unknown; error: { message: string } | null };

/**
 * The subset of the PostgREST builder we use. Supabase's fully generic builder
 * types are too deep to pass between helpers, so queries are typed against this.
 */
interface QB extends PromiseLike<Result> {
  or(filters: string): QB;
  in(column: string, values: readonly unknown[]): QB;
  gte(column: string, value: unknown): QB;
  lte(column: string, value: unknown): QB;
  gt(column: string, value: unknown): QB;
  eq(column: string, value: unknown): QB;
  neq(column: string, value: unknown): QB;
  contains(column: string, value: readonly string[]): QB;
  order(column: string, options?: { ascending?: boolean }): QB;
  limit(count: number): QB;
  maybeSingle(): PromiseLike<Result>;
}

const from = (table: "products" | "categories", columns: string) => db().from(table).select(columns) as unknown as QB;
const products = (columns = PRODUCT_COLUMNS) => from("products", columns);

function applyFilters(query: QB, q: ProductQuery, { includeCategory = true } = {}): QB {
  let builder = query;
  // Every term must match somewhere (name, brand, category or description).
  for (const term of searchTerms(q.q ?? "")) {
    builder = builder.or(
      `name.ilike.%${term}%,brand.ilike.%${term}%,category.ilike.%${term}%,short_description.ilike.%${term}%`,
    );
  }
  if (includeCategory && q.categories?.length) builder = builder.in("category", q.categories);
  if (q.minPrice != null) builder = builder.gte("price", q.minPrice);
  if (q.maxPrice != null) builder = builder.lte("price", q.maxPrice);
  if (q.inStockOnly) builder = builder.gt("stock", 0);
  if (q.onSaleOnly) builder = builder.eq("on_sale", true);
  return builder;
}

function applySort(query: QB, sort: SortOption = "featured"): QB {
  switch (sort) {
    case "newest":
      return query.order("created_at", { ascending: false }).order("id");
    case "price-asc":
      return query.order("price", { ascending: true }).order("id");
    case "price-desc":
      return query.order("price", { ascending: false }).order("id");
    case "rating":
      return query.order("rating", { ascending: false }).order("review_count", { ascending: false });
    default:
      return query.order("featured_score", { ascending: false }).order("id");
  }
}

function unwrap<T>({ data, error }: Result): T {
  if (error) throw new Error(`Catalog query failed: ${error.message}`);
  return data as T;
}

export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  const builder = applySort(applyFilters(products(), query), query.sort);
  return unwrap<ProductRow[]>(await builder).map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = unwrap<ProductRow | null>(await products().eq("slug", slug).maybeSingle());
  return row ? toProduct(row) : null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  return unwrap<ProductRow[]>(await products().in("id", ids)).map(toProduct);
}

export async function getAllProductSlugs(): Promise<string[]> {
  return unwrap<{ slug: string }[]>(await products("slug")).map((r) => r.slug);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const sameCategory = unwrap<ProductRow[]>(
    await applySort(
      products().eq("category", product.category).neq("id", product.id).limit(limit),
    ),
  ).map(toProduct);
  if (sameCategory.length >= limit) return sameCategory;

  const fill = unwrap<ProductRow[]>(
    await applySort(
      products()
        .neq("category", product.category)
        .contains("tags", ["bestseller"])
        .limit(limit - sameCategory.length),
    ),
  ).map(toProduct);
  return [...sameCategory, ...fill];
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return unwrap<ProductRow[]>(
    await applySort(products().gt("stock", 0).limit(limit)),
  ).map(toProduct);
}

export async function getBestsellers(limit = 8): Promise<Product[]> {
  return unwrap<ProductRow[]>(
    await products()
      .contains("tags", ["bestseller"])
      .order("review_count", { ascending: false })
      .limit(limit),
  ).map(toProduct);
}

export async function getNewArrivals(limit = 4): Promise<Product[]> {
  return getProducts({ sort: "newest" }).then((p) => p.slice(0, limit));
}

export async function getCategories(): Promise<Category[]> {
  const rows = unwrap<CategoryRow[]>(
    await from("categories", "slug, name, description, image").order("sort_order"),
  );
  return rows.length ? rows.map(toCategory) : staticCategories;
}

async function countByCategory(query: ProductQuery): Promise<Partial<Record<CategorySlug, number>>> {
  const rows = unwrap<{ category: CategorySlug }[]>(
    await applyFilters(products("category"), query, { includeCategory: false }),
  );
  return rows.reduce(
    (acc, r) => ({ ...acc, [r.category]: (acc[r.category] ?? 0) + 1 }),
    {} as Partial<Record<CategorySlug, number>>,
  );
}

export function getCategoryCounts() {
  return countByCategory({});
}

/** Category facet counts for the current query, ignoring the category filter itself. */
export function getFacetCounts(query: ProductQuery) {
  return countByCategory(query);
}

/** Lightweight search for the navbar suggestions dropdown. */
export async function quickSearch(q: string, limit = 5): Promise<Product[]> {
  if (!searchTerms(q).length) return [];
  const builder = applySort(applyFilters(products(), { q }).limit(limit));
  return unwrap<ProductRow[]>(await builder).map(toProduct);
}
