import { useEffect } from "react";
import { AppState } from "react-native";
import { createCartSync } from "@ekiosa/shared/cart-sync";
import { useCart } from "@/lib/cart-store";
import { supabase } from "@/lib/supabase";

/**
 * Keeps the bag in sync with the signed-in user's account cart in Supabase,
 * so it matches across the app and the website. Renders nothing.
 */
export function CartSync() {
  const hydrated = useCart((s) => s.hydrated);

  useEffect(() => {
    // Wait for the persisted cart to load, or a first sign-in would merge an empty bag.
    if (!hydrated) return;

    const sync = createCartSync({
      client: supabase,
      getLocal: () => {
        const { lines, promo } = useCart.getState();
        return { lines, promo };
      },
      setLocal: (snapshot) => useCart.getState().replace(snapshot),
      subscribeLocal: (listener) =>
        useCart.subscribe((state, prev) => {
          if (state.lines !== prev.lines || state.promo !== prev.promo) listener();
        }),
      getSyncedUserId: () => useCart.getState().syncedUserId,
      setSyncedUserId: (id) => useCart.setState({ syncedUserId: id }),
      onError: (err) => console.warn("[cart-sync]", err instanceof Error ? err.message : err),
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer out of the auth callback (Supabase advises against awaiting other calls inside it).
      setTimeout(() => sync.setUser(session?.user.id ?? null), 0);
    });

    // Pull the latest cart when the app returns to the foreground; push pending edits when it leaves.
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") sync.resume();
      else sync.flush();
    });

    return () => {
      data.subscription.unsubscribe();
      appState.remove();
      sync.dispose();
    };
  }, [hydrated]);

  return null;
}
