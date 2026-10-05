import "expo-sqlite/localStorage/install";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import { env } from "./env";

/** The app's Supabase client. Sessions persist via expo-sqlite's localStorage polyfill. */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Only refresh tokens while the app is in the foreground (saves battery).
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
