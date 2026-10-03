/** Convert database rows (snake_case) into the app's domain types. */
import type { CartLine, Category, CategorySlug, Order, Product, ProductTag, PromoCode, ShippingAddress, ShippingMethod } from "../types";

export const PRODUCT_COLUMNS =
  "id, slug, name, brand, category, price, compare_at_price, rating, review_count, stock, short_description, description, highlights, details, images, tags, created_at";

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  compare_at_price: number | null;
  rating: number | string;
  review_count: number;
  stock: number;
  short_description: string;
  description: string;
  highlights: string[];
  details: Product["details"];
  images: Product["images"];
  tags: string[];
  created_at: string;
}

export function toProduct(r: ProductRow): Product {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    brand: r.brand,
    category: r.category as CategorySlug,
    price: r.price,
    compareAtPrice: r.compare_at_price ?? undefined,
    rating: Number(r.rating),
    reviewCount: r.review_count,
    stock: r.stock,
    shortDescription: r.short_description,
    description: r.description,
    highlights: r.highlights ?? [],
    details: r.details ?? [],
    images: r.images ?? [],
    tags: (r.tags ?? []) as ProductTag[],
    createdAt: r.created_at,
  };
}

export interface CategoryRow {
  slug: string;
  name: string;
  description: string;
  image: string;
}

export function toCategory(r: CategoryRow): Category {
  return { slug: r.slug as CategorySlug, name: r.name, description: r.description, image: r.image };
}

export const ORDER_COLUMNS =
  "id, number, created_at, status, email, phone, marketing_opt_in, shipping_address, shipping_method, promo, subtotal, discount, shipping, tax, total, estimated_delivery_from, estimated_delivery_to, order_items (product_id, slug, name, image, category, unit_price, compare_at_price, quantity)";

export interface OrderRow {
  id: string;
  number: string;
  created_at: string;
  status: string;
  email: string;
  phone: string | null;
  marketing_opt_in: boolean;
  shipping_address: ShippingAddress;
  shipping_method: ShippingMethod;
  promo: PromoCode | null;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  estimated_delivery_from: string;
  estimated_delivery_to: string;
  order_items: {
    product_id: string;
    slug: string;
    name: string;
    image: string;
    category: string;
    unit_price: number;
    compare_at_price: number | null;
    quantity: number;
  }[];
}

export function toOrder(r: OrderRow): Order {
  const lines: CartLine[] = r.order_items.map((i) => ({
    productId: i.product_id,
    slug: i.slug,
    name: i.name,
    image: i.image,
    category: i.category as CategorySlug,
    unitPrice: i.unit_price,
    compareAtPrice: i.compare_at_price ?? undefined,
    quantity: i.quantity,
    maxQuantity: i.quantity,
  }));
  return {
    id: r.id,
    number: r.number,
    createdAt: r.created_at,
    status: "confirmed",
    contact: { email: r.email, phone: r.phone ?? undefined, marketingOptIn: r.marketing_opt_in },
    shippingAddress: r.shipping_address,
    shippingMethod: r.shipping_method,
    lines,
    promo: r.promo,
    totals: { subtotal: r.subtotal, discount: r.discount, shipping: r.shipping, tax: r.tax, total: r.total },
    estimatedDelivery: { from: r.estimated_delivery_from, to: r.estimated_delivery_to },
  };
}
