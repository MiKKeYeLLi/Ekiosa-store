"use client";

import { useEffect } from "react";
import { createCartSync } from "@ekiosa/shared/cart-sync";
import { cartStore, syncedUser } from "@/lib/store/cart-store";
import { createClient } from "@/lib/supabase/client";

/**
 * Keeps the bag in sync with the signed-in user's account cart in Supabase,
 * so it matches across the website and the mobile app. Renders nothing.
 */
export function CartSync() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const supabase = createClient();

    const sync = createCartSync({
      client: supabase,
      getLocal: () => {
        const { lines, promo } = cartStore.getSnapshot();
        return { lines, promo };
      },
      setLocal: (snapshot) => cartStore.replace(snapshot),
      subscribeLocal: (listener) => cartStore.subscribe(listener),
      getSyncedUserId: syncedUser.get,
      setSyncedUserId: syncedUser.set,
      // Live updates when the cart changes on another device (e.g. checkout in the app).
      subscribeRemote: (userId, onChange) => {
        const channel = supabase
          .channel(`cart:${userId}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "carts", filter: `user_id=eq.${userId}` }, onChange)
          .subscribe();
        return () => {
          supabase.removeChannel(channel);
        };
      },
      onError: (err) => console.warn("[cart-sync]", err instanceof Error ? err.message : err),
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer out of the auth callback (Supabase advises against awaiting other calls inside it).
      setTimeout(() => sync.setUser(session?.user.id ?? null), 0);
    });

    // Pull the latest cart when the tab regains focus; push pending edits when it's hidden.
    const onVisibility = () => (document.visibilityState === "visible" ? sync.resume() : sync.flush());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      data.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
      sync.dispose();
    };
  }, []);

  return null;
}
