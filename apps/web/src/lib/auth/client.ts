"use client";

import { useEffect, useState } from "react";
import { createClient } from "../supabase/client";
import { toSessionUser, type SessionUser } from "./types";

/**
 * Starts Google OAuth via Supabase. The browser is redirected to Google and
 * comes back through /auth/callback, which then forwards to `next`.
 */
export async function signInWithGoogle(next = "/") {
  const supabase = createClient();
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, queryParams: { prompt: "select_account" } },
  });
  if (error) throw error;
}

/**
 * Client-side view of the current user for UI chrome (navbar), so pages can
 * stay static. Server code must use `getUser()` for anything security-relevant.
 */
export function useSessionUser() {
  const [state, setState] = useState<{ user: SessionUser | null; ready: boolean }>({ user: null, ready: false });

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const supabase = createClient();
    const set = (u: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null | undefined) =>
      setState({ user: u ? toSessionUser(u.id, u.email, u.user_metadata) : null, ready: true });

    supabase.auth.getSession().then(({ data }) => set(data.session?.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => set(session?.user));
    return () => data.subscription.unsubscribe();
  }, []);

  return state;
}
