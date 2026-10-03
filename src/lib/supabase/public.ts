import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./env";

let client: SupabaseClient | undefined;

/**
 * Cookie-less anon client for public catalog reads. Because it never touches
 * request cookies, pages that only read the catalog can stay static.
 */
export function createPublicClient(): SupabaseClient {
  client ??= createSupabaseClient(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
