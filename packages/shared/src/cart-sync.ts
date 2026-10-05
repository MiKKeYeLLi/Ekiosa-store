/**
 * Server-side cart sync shared by the web store and the mobile app.
 *
 * Model: while signed in, Supabase (cart_items + carts) is the source of truth.
 * - First sign-in on a device: the device's cart is MERGED into the account cart.
 * - Afterwards: local changes are pushed (debounced); the server cart is pulled
 *   when the user returns to the app/tab.
 * - Signed out: the cart stays on the device only.
 */
import { PRODUCT_COLUMNS, toProduct, type ProductRow } from "./mappers";
import { lookupPromoCode } from "./pricing";
import type { CartLine, Product, PromoCode } from "./types";

export interface CartSnapshot {
  lines: CartLine[];
  promo: PromoCode | null;
}

/** Minimal Supabase client surface used here. */
export interface CartSyncClient {
  from(table: string): {
    select(columns: string): unknown;
  };
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>;
}

type Result<T> = { data: T | null; error: { message: string } | null };

export function lineFromProduct(product: Product, quantity: number): CartLine {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    image: product.images[0]?.src ?? "",
    category: product.category,
    unitPrice: product.price,
    compareAtPrice: product.compareAtPrice,
    quantity: Math.min(quantity, product.stock),
    maxQuantity: product.stock,
  };
}

/**
 * Read the signed-in user's cart (row-level security scopes it to them).
 * Lines are rebuilt from current product data, so prices and stock are fresh;
 * sold-out products are dropped.
 */
export async function fetchServerCart(client: CartSyncClient): Promise<CartSnapshot> {
  const items = (await (client.from("cart_items").select(`quantity, updated_at, product:products (${PRODUCT_COLUMNS})`) as PromiseLike<
    Result<{ quantity: number; updated_at: string; product: ProductRow | null }[]>
  >)) ;
  if (items.error) throw new Error(`Cart fetch failed: ${items.error.message}`);

  const cart = (await (client.from("carts").select("promo_code") as PromiseLike<Result<{ promo_code: string | null }[]>>));
  if (cart.error) throw new Error(`Cart fetch failed: ${cart.error.message}`);

  const lines = (items.data ?? [])
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .flatMap((r) => (r.product ? [lineFromProduct(toProduct(r.product), r.quantity)] : []))
    .filter((l) => l.quantity > 0);
  const code = cart.data?.[0]?.promo_code;
  return { lines, promo: code ? lookupPromoCode(code) : null };
}

/** Replace the signed-in user's server cart with this snapshot (atomic). */
export async function pushServerCart(client: CartSyncClient, snapshot: CartSnapshot): Promise<void> {
  const { error } = await client.rpc("replace_cart", {
    p_items: snapshot.lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
    p_promo_code: snapshot.promo?.code ?? null,
  });
  if (error) throw new Error(`Cart sync failed: ${error.message}`);
}

/**
 * Merge a device cart into the account cart (used once, on sign-in).
 * Quantities are added together and capped at the latest known stock.
 * The server's product data wins (fresher prices/stock); a local promo is kept
 * only if the server cart has none.
 */
export function mergeCarts(local: CartSnapshot, server: CartSnapshot): CartSnapshot {
  const byId = new Map<string, CartLine>();
  for (const line of server.lines) byId.set(line.productId, { ...line });
  for (const line of local.lines) {
    const existing = byId.get(line.productId);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + line.quantity, existing.maxQuantity);
    } else {
      byId.set(line.productId, { ...line, quantity: Math.min(line.quantity, line.maxQuantity) });
    }
  }
  const lines = [...byId.values()].filter((l) => l.quantity > 0);
  return { lines, promo: server.promo ?? local.promo };
}

/** Stable fingerprint used to skip redundant pushes. */
export function cartFingerprint(snapshot: CartSnapshot): string {
  return JSON.stringify([
    snapshot.lines.map((l) => [l.productId, l.quantity]).sort(),
    snapshot.promo?.code ?? null,
  ]);
}

export interface CartSyncAdapter {
  client: CartSyncClient;
  /** Current device cart. */
  getLocal(): CartSnapshot;
  /** Overwrite the device cart (must not trigger onLocalChange). */
  setLocal(snapshot: CartSnapshot): void;
  /** Subscribe to device cart changes; returns an unsubscribe function. */
  subscribeLocal(listener: () => void): () => void;
  /** The user id this device's cart was last merged for (persisted on device). */
  getSyncedUserId(): string | null;
  setSyncedUserId(id: string | null): void;
  onError?(err: unknown): void;
  debounceMs?: number;
}

/**
 * Orchestrates cart sync for one app instance. Call `setUser` whenever the auth
 * state is known/changes and `resume` when the app or tab regains focus.
 */
export function createCartSync(adapter: CartSyncAdapter) {
  const delay = adapter.debounceMs ?? 500;
  let userId: string | null = null;
  let applyingRemote = false;
  let lastPushed: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let busy: Promise<void> = Promise.resolve();
  const report = (err: unknown) => adapter.onError?.(err);

  // Serialize network operations so a pull never races a push.
  const queue = (task: () => Promise<void>) => (busy = busy.then(task).catch(report));

  const apply = (snapshot: CartSnapshot) => {
    applyingRemote = true;
    try {
      adapter.setLocal(snapshot);
    } finally {
      applyingRemote = false;
    }
    lastPushed = cartFingerprint(snapshot);
  };

  const push = () =>
    queue(async () => {
      if (!userId) return;
      const snapshot = adapter.getLocal();
      const print = cartFingerprint(snapshot);
      if (print === lastPushed) return;
      await pushServerCart(adapter.client, snapshot);
      lastPushed = print;
    });

  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
      push();
    }
    return busy;
  };

  const unsubscribe = adapter.subscribeLocal(() => {
    if (applyingRemote || !userId) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      push();
    }, delay);
  });

  return {
    /** Call with the signed-in user's id, or null when signed out. */
    setUser(nextId: string | null) {
      if (nextId === userId) return busy;
      const previous = userId;
      userId = nextId;
      if (!nextId) {
        // Signed out: drop the account's cart from this device.
        if (previous || adapter.getSyncedUserId()) {
          if (timer) clearTimeout(timer);
          timer = undefined;
          apply({ lines: [], promo: null });
          adapter.setSyncedUserId(null);
        }
        lastPushed = null;
        return busy;
      }
      return queue(async () => {
        const server = await fetchServerCart(adapter.client);
        if (adapter.getSyncedUserId() === nextId) {
          // Already merged on this device before: the server is authoritative.
          apply(server);
        } else {
          // First sign-in on this device: merge the device cart into the account.
          const merged = mergeCarts(adapter.getLocal(), server);
          apply(merged);
          await pushServerCart(adapter.client, merged);
          adapter.setSyncedUserId(nextId);
        }
      });
    },
    /** Pull the latest server cart (e.g. when the app/tab comes back into focus). */
    async resume() {
      if (!userId) return;
      await flush();
      return queue(async () => {
        if (!userId || timer) return; // a local edit started meanwhile — it will push
        apply(await fetchServerCart(adapter.client));
      });
    },
    /** Push any pending change immediately (e.g. before checkout). */
    flush,
    dispose() {
      if (timer) clearTimeout(timer);
      unsubscribe();
    },
  };
}
