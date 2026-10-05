import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { toSessionUser } from "@/lib/auth/types";
import { placeOrderForUser, type PlaceOrderInput } from "@/lib/orders/place-order";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Order placement for the mobile app.
 * Auth: `Authorization: Bearer <Supabase access token>` from the app's session.
 * Body: PlaceOrderInput. Response: PlaceOrderResult (same as the web server action).
 */
export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return unauthorized();

  // Verify the token with Supabase Auth (rejects expired or forged tokens).
  const supabase = createClient(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return unauthorized();

  let input: PlaceOrderInput;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "validation", message: "Invalid JSON body." }, { status: 400 });
  }

  const user = toSessionUser(data.user.id, data.user.email, data.user.user_metadata);
  const result = await placeOrderForUser(user, input);
  const status = result.ok ? 201 : result.code === "validation" || result.code === "empty" ? 400 : result.code === "out_of_stock" ? 409 : result.code === "payment_declined" ? 402 : 500;
  return NextResponse.json(result, { status });
}

function unauthorized() {
  return NextResponse.json({ ok: false, code: "unauthenticated", message: "Please sign in to place your order." }, { status: 401 });
}
