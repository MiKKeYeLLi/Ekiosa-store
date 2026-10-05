/**
 * Catalog service for the web app — the shared query logic from
 * `@ekiosa/shared/catalog`, bound to a cookie-less public Supabase client.
 */
import "server-only";
import { createCatalog, type Catalog } from "@ekiosa/shared/catalog";
import { createPublicClient } from "../supabase/public";

let catalog: Catalog | undefined;
const c = () => (catalog ??= createCatalog(createPublicClient()));

export const getProducts: Catalog["getProducts"] = (...a) => c().getProducts(...a);
export const getProductBySlug: Catalog["getProductBySlug"] = (...a) => c().getProductBySlug(...a);
export const getProductsByIds: Catalog["getProductsByIds"] = (...a) => c().getProductsByIds(...a);
export const getAllProductSlugs: Catalog["getAllProductSlugs"] = (...a) => c().getAllProductSlugs(...a);
export const getRelatedProducts: Catalog["getRelatedProducts"] = (...a) => c().getRelatedProducts(...a);
export const getFeaturedProducts: Catalog["getFeaturedProducts"] = (...a) => c().getFeaturedProducts(...a);
export const getBestsellers: Catalog["getBestsellers"] = (...a) => c().getBestsellers(...a);
export const getNewArrivals: Catalog["getNewArrivals"] = (...a) => c().getNewArrivals(...a);
export const getCategories: Catalog["getCategories"] = (...a) => c().getCategories(...a);
export const getCategoryCounts: Catalog["getCategoryCounts"] = (...a) => c().getCategoryCounts(...a);
export const getFacetCounts: Catalog["getFacetCounts"] = (...a) => c().getFacetCounts(...a);
export const quickSearch: Catalog["quickSearch"] = (...a) => c().quickSearch(...a);
