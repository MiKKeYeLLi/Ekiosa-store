import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PRODUCT_COLUMNS, toProduct, type ProductRow } from "@ekiosa/shared/mappers";
import type { Product } from "@ekiosa/shared/types";
import { supabase } from "./supabase";

const KEY = ["wishlist"] as const;

/** The signed-in user's saved products (newest first). Empty when signed out. */
export function useWishlist(userId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, userId ?? "anon"],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select(`created_at, product:products (${PRODUCT_COLUMNS})`)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data as unknown as { product: ProductRow | null }[]).flatMap((r) => (r.product ? [toProduct(r.product)] : []));
    },
  });
}

/** Optimistic add/remove; rolls back if the request fails. */
export function useToggleWishlist(userId: string | undefined) {
  const qc = useQueryClient();
  const key = [...KEY, userId ?? "anon"];

  return useMutation({
    mutationFn: async ({ product, saved }: { product: Product; saved: boolean }) => {
      if (!userId) throw new Error("Sign in to save favourites.");
      const { error } = saved
        ? await supabase.from("wishlist_items").delete().eq("user_id", userId).eq("product_id", product.id)
        : await supabase.from("wishlist_items").insert({ user_id: userId, product_id: product.id });
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ product, saved }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Product[]>(key);
      qc.setQueryData<Product[]>(key, (list = []) => (saved ? list.filter((p) => p.id !== product.id) : [product, ...list]));
      return { previous };
    },
    onError: (_err, _vars, ctx) => qc.setQueryData(key, ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
