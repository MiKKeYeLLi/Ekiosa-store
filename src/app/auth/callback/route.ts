import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

/** OAuth return URL: exchanges the auth code for a session cookie, then forwards to `next`. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  // Behind a proxy or tunnel, redirect back to the public host the user is on.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = forwardedHost ? `${proto}://${forwardedHost}` : request.nextUrl.origin;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
    console.error("[auth] code exchange failed:", error.message);
  }

  const providerError = searchParams.get("error_description") ?? searchParams.get("error");
  const errorUrl = new URL("/auth/error", origin);
  errorUrl.searchParams.set("next", next);
  if (providerError) errorUrl.searchParams.set("reason", providerError.slice(0, 200));
  return NextResponse.redirect(errorUrl);
}
