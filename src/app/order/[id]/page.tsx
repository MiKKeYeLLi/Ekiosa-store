import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { getOrder } from "@/lib/services/orders-server";
import { OrderConfirmation } from "./order-confirmation";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function OrderPage({ params }: PageProps<"/order/[id]">) {
  const { id } = await params;
  const user = await getUser();
  // Email links land here — ask signed-out visitors to sign in, then come back.
  if (!user) redirect(`/account?next=${encodeURIComponent(`/order/${id}`)}`);

  // Row-level security only returns orders owned by the signed-in user.
  const order = await getOrder(id);
  if (!order) notFound();
  return <OrderConfirmation order={order} />;
}
