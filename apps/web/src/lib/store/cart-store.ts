/**
 * Client cart store, persisted to localStorage.
 *
 * Implemented as a tiny external store consumed via `useSyncExternalStore`,
 * which keeps server and first client render identical (empty cart) and then
 * hydrates from storage — no hydration mismatches.
 *
 * When accounts land, this can sync to a server-side cart keyed by user id;
 * components only depend on the `useCart` hook API.
 */
import type { CartLine, Product, PromoCode } from "../types";

export interface CartState {
  lines: CartLine[];
  promo: PromoCode | null;
  /** True once state has been read from storage on the client. */
  hydrated: boolean;
}

const STORAGE_KEY = "loam:cart:v1";
const EMPTY: CartState = { lines: [], promo: null, hydrated: false };

let state: CartState = EMPTY;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines: state.lines, promo: state.promo }));
  } catch {
    // Storage may be unavailable (private mode, quota) — cart still works in memory.
  }
}

function setState(next: Partial<CartState>) {
  state = { ...state, ...next };
  persist();
  emit();
}

function hydrate() {
  if (state.hydrated || typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<CartState>) : {};
    state = {
      lines: Array.isArray(parsed.lines) ? parsed.lines : [],
      promo: parsed.promo ?? null,
      hydrated: true,
    };
  } catch {
    state = { ...EMPTY, hydrated: true };
  }
}

export const cartStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (!state.hydrated) {
      hydrate();
      // Notify after subscription so consumers pick up the hydrated snapshot.
      queueMicrotask(emit);
    }
    // Keep tabs in sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      state = { ...state, hydrated: false };
      hydrate();
      emit();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot(): CartState {
    return state;
  },
  getServerSnapshot(): CartState {
    return EMPTY;
  },

  /** Adds a product. Returns the quantity actually added (clamped to stock). */
  add(product: Product, quantity = 1): number {
    const existing = state.lines.find((l) => l.productId === product.id);
    const current = existing?.quantity ?? 0;
    const nextQty = Math.min(current + quantity, product.stock);
    const added = nextQty - current;
    if (added <= 0) return 0;
    if (existing) {
      setState({ lines: state.lines.map((l) => (l.productId === product.id ? { ...l, quantity: nextQty, maxQuantity: product.stock } : l)) });
    } else {
      const line: CartLine = {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0]?.src ?? "",
        category: product.category,
        unitPrice: product.price,
        compareAtPrice: product.compareAtPrice,
        quantity: nextQty,
        maxQuantity: product.stock,
      };
      setState({ lines: [line, ...state.lines] });
    }
    return added;
  },

  setQuantity(productId: string, quantity: number) {
    if (quantity <= 0) return cartStore.remove(productId);
    setState({
      lines: state.lines.map((l) =>
        l.productId === productId ? { ...l, quantity: Math.min(quantity, l.maxQuantity) } : l,
      ),
    });
  },

  remove(productId: string): CartLine | undefined {
    const removed = state.lines.find((l) => l.productId === productId);
    setState({ lines: state.lines.filter((l) => l.productId !== productId) });
    return removed;
  },

  /** Re-insert a line (used by "Undo" after removing). */
  restore(line: CartLine) {
    if (state.lines.some((l) => l.productId === line.productId)) return;
    setState({ lines: [line, ...state.lines] });
  },

  applyPromo(promo: PromoCode | null) {
    setState({ promo });
  },

  clear() {
    setState({ lines: [], promo: null });
  },

  /** Overwrite the whole cart (used by account sync). */
  replace(snapshot: { lines: CartLine[]; promo: PromoCode | null }) {
    setState({ lines: snapshot.lines, promo: snapshot.promo });
  },
};

const SYNCED_USER_KEY = "loam:cart:synced-user";

/** The account this device's cart was last merged into (see @ekiosa/shared/cart-sync). */
export const syncedUser = {
  get(): string | null {
    try {
      return localStorage.getItem(SYNCED_USER_KEY);
    } catch {
      return null;
    }
  },
  set(id: string | null) {
    try {
      if (id) localStorage.setItem(SYNCED_USER_KEY, id);
      else localStorage.removeItem(SYNCED_USER_KEY);
    } catch {
      // storage unavailable — sync still works for this session
    }
  },
};
