import type { Metadata } from "next";
import { CheckoutSignInGate } from "@/components/checkout/checkout-sign-in-gate";
import { getUser } from "@/lib/auth/get-user";
import { CheckoutView } from "./checkout-view";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await getUser();
  // Google sign-in is required to place an order. The bag lives in localStorage,
  // so it survives the OAuth round trip.
  if (!user) return <CheckoutSignInGate />;
  return <CheckoutView user={user} />;
}
