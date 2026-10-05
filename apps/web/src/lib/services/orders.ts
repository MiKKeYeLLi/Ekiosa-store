/**
 * Client-side order service. Orders are created by the `placeOrderAction`
 * server action (validated, re-priced from the database and created atomically).
 * When Stripe is added, payment confirmation slots in before order creation.
 */
import { placeOrderAction } from "@/app/checkout/actions";
import type { CheckoutFormValues } from "../checkout-validation";
import type { CartLine, PromoCode, ShippingMethodId } from "../types";

export type CheckoutErrorCode = "unauthenticated" | "validation" | "out_of_stock" | "payment_declined" | "empty" | "unknown";

export class CheckoutError extends Error {
  constructor(
    message: string,
    public code: CheckoutErrorCode = "unknown",
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

export async function placeOrder(payload: {
  values: CheckoutFormValues;
  shippingMethodId: ShippingMethodId;
  lines: CartLine[];
  promo: PromoCode | null;
  simulateFailure?: boolean;
}): Promise<{ id: string; number: string }> {
  let result;
  try {
    result = await placeOrderAction({
      values: payload.values,
      shippingMethodId: payload.shippingMethodId,
      items: payload.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      promoCode: payload.promo?.code ?? null,
      simulateFailure: payload.simulateFailure,
    });
  } catch {
    throw new CheckoutError("We couldn't reach the server. Check your connection and try again.", "unknown");
  }
  if (!result.ok) throw new CheckoutError(result.message, result.code);
  return { id: result.orderId, number: result.number };
}
