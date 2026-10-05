/**
 * Bag state, persisted on the device. Same behaviour as the web cart store
 * (apps/web/src/lib/store/cart-store.ts): quantities clamp to stock, removed
 * lines can be restored, and a promo code can be applied.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { computeTotals, getSavings, getShippingMethod, getSubtotal } from "@ekiosa/shared/pricing";
import type { CartLine, Product, PromoCode } from "@ekiosa/shared/types";

interface CartState {
  lines: CartLine[];
  promo: PromoCode | null;
  hydrated: boolean;
  /** Returns how many units were actually added (0 when stock is exhausted). */
  add: (product: Product, quantity?: number) => number;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => CartLine | undefined;
  restore: (line: CartLine) => void;
  applyPromo: (promo: PromoCode | null) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      promo: null,
      hydrated: false,

      add(product, quantity = 1) {
        const existing = get().lines.find((l) => l.productId === product.id);
        const current = existing?.quantity ?? 0;
        const next = Math.min(current + quantity, product.stock);
        const added = next - current;
        if (added <= 0) return 0;
        if (existing) {
          set({ lines: get().lines.map((l) => (l.productId === product.id ? { ...l, quantity: next, maxQuantity: product.stock } : l)) });
        } else {
          const line: CartLine = {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            image: product.images[0]?.src ?? "",
            category: product.category,
            unitPrice: product.price,
            compareAtPrice: product.compareAtPrice,
            quantity: next,
            maxQuantity: product.stock,
          };
          set({ lines: [line, ...get().lines] });
        }
        return added;
      },

      setQuantity(productId, quantity) {
        if (quantity <= 0) {
          get().remove(productId);
          return;
        }
        set({ lines: get().lines.map((l) => (l.productId === productId ? { ...l, quantity: Math.min(quantity, l.maxQuantity) } : l)) });
      },

      remove(productId) {
        const removed = get().lines.find((l) => l.productId === productId);
        set({ lines: get().lines.filter((l) => l.productId !== productId) });
        return removed;
      },

      restore(line) {
        if (get().lines.some((l) => l.productId === line.productId)) return;
        set({ lines: [line, ...get().lines] });
      },

      applyPromo: (promo) => set({ promo }),
      clear: () => set({ lines: [], promo: null }),
    }),
    {
      name: "ekiosa:cart:v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ lines, promo }) => ({ lines, promo }),
      onRehydrateStorage: () => () => useCart.setState({ hydrated: true }),
    },
  ),
);

/** Derived values — subscribe with a selector to avoid unnecessary re-renders. */
export const selectItemCount = (s: CartState) => s.lines.reduce((n, l) => n + l.quantity, 0);

export function cartTotals(lines: CartLine[], promo: PromoCode | null, methodId: Parameters<typeof getShippingMethod>[0] = "standard", includeTax = true) {
  return {
    ...computeTotals(lines, promo, getShippingMethod(methodId), { includeTax }),
    savings: getSavings(lines),
    rawSubtotal: getSubtotal(lines),
  };
}
