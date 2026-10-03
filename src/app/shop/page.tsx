import type { Metadata } from "next";
import { parseProductQuery } from "@/lib/search-params";
import { getFacetCounts, getProducts } from "@/lib/services/catalog";
import { ShopView } from "./shop-view";

export const metadata: Metadata = {
  title: "Shop all",
  description: "Browse the full Loam collection — apparel, footwear, accessories, audio, home and beauty.",
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
  }
  const query = parseProductQuery(params);
  const [products, facetCounts] = await Promise.all([getProducts(query), getFacetCounts(query)]);

  return <ShopView paramsKey={params.toString()} products={products} facetCounts={facetCounts} />;
}
