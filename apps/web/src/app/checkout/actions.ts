"use server";

import { getUser } from "@/lib/auth/get-user";
import { placeOrderForUser, type PlaceOrderInput, type PlaceOrderResult } from "@/lib/orders/place-order";

export type { PlaceOrderInput, PlaceOrderResult };

export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const user = await getUser();
  if (!user) return { ok: false, code: "unauthenticated", message: "Please sign in to place your order." };
  return placeOrderForUser(user, input);
}
