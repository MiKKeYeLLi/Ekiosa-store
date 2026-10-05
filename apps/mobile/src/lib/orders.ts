import { useQuery } from "@tanstack/react-query";
import type { CheckoutFormValues } from "@ekiosa/shared/checkout-validation";
import { ORDER_COLUMNS, toOrder, type OrderRow } from "@ekiosa/shared/mappers";
import type { CartLine, PromoCode, ShippingMethodId } from "@ekiosa/shared/types";
import { env } from "./env";
import { supabase } from "./supabase";

export type OrderErrorCode = "unauthenticated" | "validation" | "out_of_stock" | "payment_declined" | "empty" | "unknown";

export class OrderError extends Error {
  constructor(
    message: string,
    public code: OrderErrorCode,
  ) {
    super(message);
  }
}

/**
 * Places an order through the web app's API (POST /api/orders), which runs the
 * same server-side validation, repricing, stock check and email as the website.
 */
export async function placeOrder(payload: {
  values: CheckoutFormValues;
  shippingMethodId: ShippingMethodId;
  lines: CartLine[];
  promo: PromoCode | null;
  simulateFailure?: boolean;
}): Promise<{ orderId: string; number: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new OrderError("Please sign in to place your order.", "unauthenticated");

  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        values: payload.values,
        shippingMethodId: payload.shippingMethodId,
        items: payload.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        promoCode: payload.promo?.code ?? null,
        simulateFailure: payload.simulateFailure ?? false,
      }),
    });
  } catch {
    throw new OrderError("We couldn't reach the store. Check your connection and try again.", "unknown");
  }

  const body = (await res.json().catch(() => null)) as
    | { ok: true; orderId: string; number: string }
    | { ok: false; code: OrderErrorCode; message: string }
    | null;
  if (!body) throw new OrderError("Something went wrong on our side. Please try again.", "unknown");
  if (!body.ok) throw new OrderError(body.message, body.code);
  return { orderId: body.orderId, number: body.number };
}

export const orderKeys = {
  all: ["orders"] as const,
  one: (id: string) => ["orders", id] as const,
};

/** Orders are readable only by their owner (row-level security). */
export function useMyOrders(enabled: boolean) {
  return useQuery({
    queryKey: orderKeys.all,
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select(ORDER_COLUMNS).order("created_at", { ascending: false }).limit(30);
      if (error) throw new Error(error.message);
      return (data as unknown as OrderRow[]).map(toOrder);
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.one(id),
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select(ORDER_COLUMNS).eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toOrder(data as unknown as OrderRow) : null;
    },
  });
}
