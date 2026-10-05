import { useQuery } from "@tanstack/react-query";
import { createCatalog } from "@ekiosa/shared/catalog";
import type { Product, ProductQuery } from "@ekiosa/shared/types";
import { supabase } from "./supabase";

/** Same filter/sort/search logic as the website, via the shared catalog factory. */
export const catalog = createCatalog(supabase);

export const catalogKeys = {
  products: (q: ProductQuery) => ["products", q] as const,
  facets: (q: ProductQuery) => ["facets", q] as const,
  product: (slug: string) => ["product", slug] as const,
  related: (id: string) => ["related", id] as const,
  home: ["home"] as const,
  search: (q: string) => ["search", q] as const,
};

export function useProducts(query: ProductQuery) {
  return useQuery({ queryKey: catalogKeys.products(query), queryFn: () => catalog.getProducts(query) });
}

export function useFacetCounts(query: ProductQuery) {
  return useQuery({ queryKey: catalogKeys.facets(query), queryFn: () => catalog.getFacetCounts(query) });
}

export function useProduct(slug: string) {
  return useQuery({ queryKey: catalogKeys.product(slug), queryFn: () => catalog.getProductBySlug(slug) });
}

export function useRelated(product: Product | null | undefined) {
  return useQuery({
    queryKey: catalogKeys.related(product?.id ?? ""),
    queryFn: () => catalog.getRelatedProducts(product!, 6),
    enabled: !!product,
  });
}

export function useHome() {
  return useQuery({
    queryKey: catalogKeys.home,
    queryFn: async () => {
      const [bestsellers, newArrivals, categories, counts, sale] = await Promise.all([
        catalog.getBestsellers(8),
        catalog.getNewArrivals(6),
        catalog.getCategories(),
        catalog.getCategoryCounts(),
        catalog.getProducts({ onSaleOnly: true, sort: "featured" }),
      ]);
      return { bestsellers, newArrivals, categories, counts, sale: sale.slice(0, 6) };
    },
  });
}

export function useQuickSearch(q: string) {
  return useQuery({
    queryKey: catalogKeys.search(q),
    queryFn: () => catalog.quickSearch(q, 8),
    enabled: q.trim().length > 0,
    staleTime: 60_000,
  });
}
