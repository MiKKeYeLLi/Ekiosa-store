import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Browser client — used to start OAuth sign-in. */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
