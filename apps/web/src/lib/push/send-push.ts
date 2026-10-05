import "server-only";
import { createAdminClient } from "../supabase/admin";

interface PushMessage {
  title: string;
  body: string;
  /** In-app route to open when tapped, e.g. "/order/<id>". */
  url?: string;
}

interface ExpoTicket {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

/**
 * Send a push notification to every device registered for a user via the
 * Expo Push API. Tokens Expo reports as DeviceNotRegistered are removed.
 * Never throws — notifications are best-effort.
 */
export async function sendPushToUser(userId: string, message: PushMessage): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: rows, error } = await admin.from("push_tokens").select("token").eq("user_id", userId);
    if (error) throw new Error(error.message);
    const tokens = (rows ?? []).map((r) => r.token as string);
    if (!tokens.length) return;

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(
        tokens.map((to) => ({
          to,
          title: message.title,
          body: message.body,
          sound: "default",
          channelId: "orders",
          data: message.url ? { url: message.url } : {},
        })),
      ),
    });
    if (!res.ok) throw new Error(`Expo push API responded ${res.status}`);

    const { data: tickets } = (await res.json()) as { data: ExpoTicket[] };
    const dead = tickets.flatMap((t, i) => (t.status === "error" && t.details?.error === "DeviceNotRegistered" ? [tokens[i]] : []));
    if (dead.length) await admin.from("push_tokens").delete().in("token", dead);
    for (const t of tickets) if (t.status === "error" && t.details?.error !== "DeviceNotRegistered") console.warn("[push] ticket error:", t.message);
  } catch (err) {
    console.error(`[push] Failed to notify user ${userId}:`, err instanceof Error ? err.message : err);
  }
}

export async function sendOrderPush(order: { id: string; number: string; userId: string }, kind: "confirmed" | "shipped" | "delivered") {
  const copy = {
    confirmed: { title: "Order confirmed", body: `Thanks! Order ${order.number} is confirmed and being prepared.` },
    shipped: { title: "Your order has shipped", body: `Order ${order.number} is on its way.` },
    delivered: { title: "Delivered", body: `Order ${order.number} has been delivered. Enjoy!` },
  }[kind];
  await sendPushToUser(order.userId, { ...copy, url: `/order/${order.id}` });
}
