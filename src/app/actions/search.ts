"use server";

import { quickSearch } from "@/lib/services/catalog";
import type { Product } from "@/lib/types";

/** Navbar search suggestions. */
export async function searchProductsAction(q: string): Promise<Product[]> {
  if (typeof q !== "string" || q.length > 100) return [];
  return quickSearch(q, 5);
}
