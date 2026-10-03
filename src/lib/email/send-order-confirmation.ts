import "server-only";
import { createAdminClient } from "../supabase/admin";
import { ORDER_COLUMNS, toOrder, type OrderRow } from "../supabase/mappers";
import { isMailgunConfigured, sendEmail } from "./mailgun";
import { renderOrderConfirmation } from "./order-confirmation";

/**
 * Send the confirmation email for an order and record when it was sent.
 * Never throws — a failed email must not affect a placed order.
 * (When Stripe is added, call this from the payment webhook instead.)
 */
export async function sendOrderConfirmation(orderId: string): Promise<void> {
  try {
    if (!isMailgunConfigured()) {
      console.warn(`[email] Mailgun not configured — skipping confirmation for order ${orderId}`);
      return;
    }
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("orders")
      .select(`${ORDER_COLUMNS}, confirmation_email_sent_at`)
      .eq("id", orderId)
      .single();
    if (error || !data) throw new Error(error?.message ?? "order not found");
    if ((data as { confirmation_email_sent_at: string | null }).confirmation_email_sent_at) return; // already sent

    const order = toOrder(data as unknown as OrderRow);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const { subject, html, text } = renderOrderConfirmation(order, siteUrl);

    await sendEmail({ to: order.contact.email, subject, html, text, tags: ["order-confirmation"] });
    await admin.from("orders").update({ confirmation_email_sent_at: new Date().toISOString() }).eq("id", orderId);
  } catch (err) {
    console.error(`[email] Failed to send confirmation for order ${orderId}:`, err instanceof Error ? err.message : err);
  }
}
