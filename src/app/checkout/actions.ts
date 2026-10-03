"use server";

import { after } from "next/server";
import { sendOrderConfirmation } from "@/lib/email/send-order-confirmation";
import { getUser } from "@/lib/auth/get-user";
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

export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const user = await getUser();
  if (!user) return { ok: false, code: "unauthenticated", message: "Please sign in to place your order." };

  // ── Validate input (never trust the client) ──────────────────────
  const values: CheckoutFormValues = { ...input.values, email: user.email || input.values.email };
  const errors = validateAll(values);
  if (Object.keys(errors).length) {
    return { ok: false, code: "validation", message: "Some details are missing or invalid. Please review the form." };
  }
  if (!SHIPPING_IDS.includes(input.shippingMethodId)) {
    return { ok: false, code: "validation", message: "Please choose a delivery method." };
  }
  const quantities = new Map<string, number>();
  for (const item of input.items ?? []) {
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
  const promo = input.promoCode ? lookupPromoCode(input.promoCode) : null;
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

  // Send the confirmation email after the response, so it never delays checkout.
  after(() => sendOrderConfirmation(created.id));

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
