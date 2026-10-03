"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getSavings, getSubtotal } from "../pricing";
import { cartStore } from "./cart-store";

export function useCart() {
  const state = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);

  const derived = useMemo(
    () => ({
      itemCount: state.lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: getSubtotal(state.lines),
      savings: getSavings(state.lines),
    }),
    [state.lines],
  );

  return {
    ...state,
    ...derived,
    add: cartStore.add,
    setQuantity: cartStore.setQuantity,
    remove: cartStore.remove,
    restore: cartStore.restore,
    applyPromo: cartStore.applyPromo,
    clear: cartStore.clear,
  };
}
