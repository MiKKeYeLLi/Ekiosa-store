/**
 * Order placement core, shared by the web server action and the mobile API
 * route (POST /api/orders). Callers must authenticate the user first.
 */
import "server-only";
import { after } from "next/server";
import { sendOrderConfirmation } from "@/lib/email/send-order-confirmation";
import { sendOrderPush } from "@/lib/push/send-push";
import type { SessionUser } from "@/lib/auth/types";
import { validateAll, type CheckoutFormValues } from "@/lib/checkout-validation";
import { computeTotals, getShippingMethod, lookupPromoCode } from "@/lib/pricing";
import { getProductsByIds } from "@/lib/services/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CartLine, ShippingMethodId } from "@/lib/types";
import { addBusinessDays } from "@/lib/utils";

export interface PlaceOrderInput {
  values: CheckoutFormValues;
  shippingMethodId: ShippingMethodId;
  items: { productId: string; quantity: number }[];
  promoCode: string | null;
  /** Demo-only: exercise the declined-payment state until real payments exist. */
  simulateFailure?: boolean;
}

export type PlaceOrderResult =
  | { ok: true; orderId: string; number: string }
  | {
      ok: false;
      code: "unauthenticated" | "validation" | "out_of_stock" | "payment_declined" | "empty" | "unknown";
      message: string;
    };

const SHIPPING_IDS: ShippingMethodId[] = ["standard", "express", "next-day"];

export async function placeOrderForUser(user: SessionUser, input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (!input || typeof input !== "object" || !input.values || typeof input.values !== "object") {
    return { ok: false, code: "validation", message: "Invalid order request." };
  }

  // ── Validate input (never trust the client) ──────────────────────
  // Coerce every field to the expected type — this input may come from an API request.
  const raw = input.values as unknown as Record<string, unknown>;
  const str = (key: keyof CheckoutFormValues) => (typeof raw[key] === "string" ? (raw[key] as string).slice(0, 200) : "");
  const values: CheckoutFormValues = {
    email: user.email || str("email"),
    phone: str("phone"),
    marketingOptIn: raw.marketingOptIn === true,
    firstName: str("firstName"),
    lastName: str("lastName"),
    address1: str("address1"),
    address2: str("address2"),
    city: str("city"),
    region: str("region"),
    postalCode: str("postalCode"),
    country: str("country"),
  };
  const errors = validateAll(values);
  if (Object.keys(errors).length) {
    return { ok: false, code: "validation", message: "Some details are missing or invalid. Please review the form." };
  }
  if (!SHIPPING_IDS.includes(input.shippingMethodId)) {
    return { ok: false, code: "validation", message: "Please choose a delivery method." };
  }
  const quantities = new Map<string, number>();
  for (const item of Array.isArray(input.items) ? input.items.slice(0, 50) : []) {
    if (!item || typeof item !== "object") return { ok: false, code: "validation", message: "Your bag contains an invalid item." };
    const qty = Math.floor(Number(item.quantity));
    if (typeof item.productId !== "string" || !Number.isFinite(qty) || qty < 1 || qty > 99) {
      return { ok: false, code: "validation", message: "Your bag contains an invalid item." };
    }
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + qty);
  }
  if (!quantities.size) return { ok: false, code: "empty", message: "Your bag is empty." };

  if (input.simulateFailure) {
    return {
      ok: false,
      code: "payment_declined",
      message: "Your payment was declined. No charge was made — please check your details and try again.",
    };
  }

  // ── Re-price from the database ───────────────────────────────────
  const products = await getProductsByIds([...quantities.keys()]);
  if (products.length !== quantities.size) {
    return { ok: false, code: "out_of_stock", message: "An item in your bag is no longer available. Please review your bag." };
  }
  const lines: CartLine[] = products.map((p) => ({
    productId: p.id,
    slug: p.slug,
    name: p.name,
    image: p.images[0]?.src ?? "",
    category: p.category,
    unitPrice: p.price,
    compareAtPrice: p.compareAtPrice,
    quantity: quantities.get(p.id)!,
    maxQuantity: p.stock,
  }));
  const short = lines.find((l) => l.quantity > l.maxQuantity);
  if (short) return outOfStock(short.name, short.maxQuantity);

  const method = getShippingMethod(input.shippingMethodId);
  const promo = typeof input.promoCode === "string" && input.promoCode ? lookupPromoCode(input.promoCode) : null;
  const totals = computeTotals(lines, promo, method);
  const now = new Date();

  // ── Create atomically (stock check + decrement + insert) ─────────
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_order", {
    p_user: user.id,
    p_order: {
      email: values.email.trim(),
      phone: values.phone.trim() || null,
      marketing_opt_in: values.marketingOptIn,
      shipping_address: {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        address1: values.address1.trim(),
        address2: values.address2.trim() || undefined,
        city: values.city.trim(),
        region: values.region.trim(),
        postalCode: values.postalCode.trim().toUpperCase(),
        country: values.country,
      },
      shipping_method: method,
      promo,
      ...totals,
      estimated_delivery_from: addBusinessDays(now, method.minDays).toISOString(),
      estimated_delivery_to: addBusinessDays(now, method.maxDays).toISOString(),
    },
    p_items: lines.map((l) => ({
      product_id: l.productId,
      slug: l.slug,
      name: l.name,
      image: l.image,
      category: l.category,
      unit_price: l.unitPrice,
      compare_at_price: l.compareAtPrice ?? null,
      quantity: l.quantity,
    })),
  });

  if (error) {
    const match = /out_of_stock:(\S+)/.exec(error.message);
    if (match) {
      const line = lines.find((l) => l.productId === match[1]);
      return outOfStock(line?.name ?? "An item", 0);
    }
    console.error("[checkout] create_order failed:", error.message);
    return { ok: false, code: "unknown", message: "We couldn't place your order. You haven't been charged — please try again." };
  }

  const created = (Array.isArray(data) ? data[0] : data) as { id: string; number: string };

  // Empty the account cart (synced across web and mobile) now that it's been ordered.
  const [items, meta] = await Promise.all([
    admin.from("cart_items").delete().eq("user_id", user.id),
    admin.from("carts").update({ promo_code: null, updated_at: new Date().toISOString() }).eq("user_id", user.id),
  ]);
  const cartError = items.error ?? meta.error;
  if (cartError) console.warn("[checkout] couldn't clear account cart:", cartError.message);

  // Send the confirmation email and push after the response, so they never delay checkout.
  after(() => sendOrderConfirmation(created.id));
  after(() => sendOrderPush({ id: created.id, number: created.number, userId: user.id }, "confirmed"));

  return { ok: true, orderId: created.id, number: created.number };
}

function outOfStock(name: string, available: number): PlaceOrderResult {
  return {
    ok: false,
    code: "out_of_stock",
    message:
      available > 0
        ? `Only ${available} of “${name}” left in stock. Please update the quantity in your bag.`
        : `“${name}” just sold out. Please remove it from your bag to continue.`,
  };
}
