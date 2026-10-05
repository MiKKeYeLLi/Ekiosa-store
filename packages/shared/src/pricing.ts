/**
 * Pricing rules shared by the cart and checkout.
 * In production these should be (re)computed server-side — e.g. inside a
 * Stripe Checkout/PaymentIntent flow — and the client values treated as estimates.
 */
import type { CartLine, OrderTotals, PromoCode, ShippingMethod, ShippingMethodId } from "./types";

export const FREE_SHIPPING_THRESHOLD = 10000; // $100
export const TAX_RATE = 0.08;

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "standard",
    name: "Standard",
    description: "Tracked delivery",
    price: 800,
    minDays: 4,
    maxDays: 6,
    freeOver: FREE_SHIPPING_THRESHOLD,
  },
  { id: "express", name: "Express", description: "Priority handling", price: 1800, minDays: 2, maxDays: 3 },
  { id: "next-day", name: "Next day", description: "Order by 2pm", price: 3200, minDays: 1, maxDays: 1 },
];

export function getShippingMethod(id: ShippingMethodId): ShippingMethod {
  return SHIPPING_METHODS.find((m) => m.id === id) ?? SHIPPING_METHODS[0];
}

/** Demo promo codes. Replace with a server-side lookup (e.g. Stripe Promotion Codes). */
const PROMO_CODES: Record<string, PromoCode> = {
  WELCOME10: { code: "WELCOME10", percentOff: 10, label: "10% off your first order" },
  EKIOSA20: { code: "EKIOSA20", percentOff: 20, label: "20% off — friends of Ekiosa" },
  // Legacy code from before the rename; still honoured.
  LOAM20: { code: "LOAM20", percentOff: 20, label: "20% off — friends of Ekiosa" },
};

export function lookupPromoCode(raw: string): PromoCode | null {
  return PROMO_CODES[raw.trim().toUpperCase()] ?? null;
}

export function getSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

export function getSavings(lines: CartLine[]): number {
  return lines.reduce(
    (sum, l) => sum + (l.compareAtPrice && l.compareAtPrice > l.unitPrice ? (l.compareAtPrice - l.unitPrice) * l.quantity : 0),
    0,
  );
}

export function getShippingCost(method: ShippingMethod, subtotalAfterDiscount: number): number {
  if (method.freeOver != null && subtotalAfterDiscount >= method.freeOver) return 0;
  return method.price;
}

export function computeTotals(
  lines: CartLine[],
  promo: PromoCode | null | undefined,
  method: ShippingMethod,
  { includeTax = true }: { includeTax?: boolean } = {},
): OrderTotals {
  const subtotal = getSubtotal(lines);
  const discount = promo ? Math.round((subtotal * promo.percentOff) / 100) : 0;
  const discounted = subtotal - discount;
  const shipping = lines.length ? getShippingCost(method, discounted) : 0;
  const tax = includeTax ? Math.round(discounted * TAX_RATE) : 0;
  return { subtotal, discount, shipping, tax, total: discounted + shipping + tax };
}
