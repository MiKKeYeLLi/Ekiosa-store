import type { Metadata } from "next";
import { getFeaturedProducts } from "@/lib/services/catalog";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Your bag" };

export const revalidate = 60;

export default async function CartPage() {
  const recommendations = await getFeaturedProducts(10);
  return <CartView recommendations={recommendations} />;
}
