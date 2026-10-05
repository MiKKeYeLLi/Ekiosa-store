/**
 * Domain types shared across the UI.
 *
 * These are intentionally shaped like rows a backend (e.g. Supabase) would
 * return, so the mock data layer in `lib/services` can be swapped for real
 * queries without changing components. Money is always stored in minor
 * units (cents) to match payment providers such as Stripe.
 */

export type CategorySlug =
  | "apparel"
  | "footwear"
  | "accessories"
  | "audio-tech"
  | "home"
  | "beauty";

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
  image: string;
}

export interface ProductImage {
  src: string;
  alt: string;
}

export interface ProductDetail {
  label: string;
  value: string;
}

export type ProductTag = "bestseller" | "new" | "featured" | "limited";

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: CategorySlug;
  /** Price in cents. */
  price: number;
  /** Original price in cents, when the product is discounted. */
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  /** Units available. 0 means sold out. */
  stock: number;
  shortDescription: string;
  description: string;
  highlights: string[];
  details: ProductDetail[];
  images: ProductImage[];
  tags: ProductTag[];
  /** ISO date — used for "Newest" sorting. */
  createdAt: string;
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type SortOption = "featured" | "newest" | "price-asc" | "price-desc" | "rating";

export interface ProductQuery {
  q?: string;
  categories?: CategorySlug[];
  minPrice?: number; // cents
  maxPrice?: number; // cents
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  sort?: SortOption;
}

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  image: string;
  category: CategorySlug;
  /** Unit price in cents at the time it was added. */
  unitPrice: number;
  compareAtPrice?: number;
  quantity: number;
  /** Max purchasable quantity (stock). */
  maxQuantity: number;
}

export interface PromoCode {
  code: string;
  /** Percentage off the subtotal, 0–100. */
  percentOff: number;
  label: string;
}

export type ShippingMethodId = "standard" | "express" | "next-day";

export interface ShippingMethod {
  id: ShippingMethodId;
  name: string;
  description: string;
  /** Price in cents. */
  price: number;
  minDays: number;
  maxDays: number;
  /** Subtotal (cents) at or above which this method is free. */
  freeOver?: number;
}

export interface ContactInfo {
  email: string;
  phone?: string;
  marketingOptIn: boolean;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface CheckoutPayload {
  contact: ContactInfo;
  shippingAddress: ShippingAddress;
  shippingMethodId: ShippingMethodId;
  lines: CartLine[];
  promo?: PromoCode | null;
  /** Demo-only switch to exercise the error state. */
  simulateFailure?: boolean;
}

export type OrderStatus = "confirmed" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  status: OrderStatus;
  contact: ContactInfo;
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethod;
  lines: CartLine[];
  promo?: PromoCode | null;
  totals: OrderTotals;
  estimatedDelivery: { from: string; to: string };
}
