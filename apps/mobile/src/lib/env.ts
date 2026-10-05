/**
 * Public configuration, inlined at build time from EXPO_PUBLIC_* variables
 * (apps/mobile/.env locally, EAS environment variables for cloud builds).
 * Never put the Supabase service-role key or any other secret in the app.
 */
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing ${name}. Copy apps/mobile/.env.example to apps/mobile/.env and fill it in.`);
  return value;
}

export const env = {
  supabaseUrl: required("EXPO_PUBLIC_SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required("EXPO_PUBLIC_SUPABASE_ANON_KEY", process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  /** Base URL of the deployed web app, which hosts POST /api/orders. */
  apiUrl: required("EXPO_PUBLIC_API_URL", process.env.EXPO_PUBLIC_API_URL).replace(/\/$/, ""),
  /** Google OAuth *Web* client ID — required by native Google Sign-In to issue an ID token for Supabase. */
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
};
