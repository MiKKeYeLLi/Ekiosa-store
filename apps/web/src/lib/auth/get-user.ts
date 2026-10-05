import "server-only";
import { createClient } from "../supabase/server";
import { toSessionUser, type SessionUser } from "./types";

/** The signed-in user for this request, verified from the session JWT, or null. */
export async function getUser(): Promise<SessionUser | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const { sub, email, user_metadata } = data.claims as {
    sub: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
  return toSessionUser(sub, email, user_metadata);
}
