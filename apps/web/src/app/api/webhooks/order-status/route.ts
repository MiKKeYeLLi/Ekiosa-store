import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { sendOrderPush } from "@/lib/push/send-push";

/**
 * Supabase Database Webhook target for UPDATEs on public.orders.
 * Sends a push when an order's status changes to shipped or delivered.
 *
 * Setup (Supabase → Database → Webhooks): table `orders`, event UPDATE,
 * HTTP POST to https://<site>/api/webhooks/order-status with header
 * `x-webhook-secret: <ORDER_WEBHOOK_SECRET>`.
 */
interface UpdatePayload {
  type: "UPDATE";
  table: "orders";
  record: { id: string; number: string; user_id: string; status: string };
  old_record: { status: string } | null;
}

function authorized(request: NextRequest) {
  const expected = process.env.ORDER_WEBHOOK_SECRET;
  const given = request.headers.get("x-webhook-secret");
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const payload = (await request.json().catch(() => null)) as UpdatePayload | null;
  if (payload?.type !== "UPDATE" || payload.table !== "orders" || !payload.record) {
    return NextResponse.json({ ignored: true });
  }

  const { record, old_record } = payload;
  if (record.status === old_record?.status) return NextResponse.json({ ignored: "status unchanged" });
  if (record.status !== "shipped" && record.status !== "delivered") return NextResponse.json({ ignored: record.status });

  await sendOrderPush({ id: record.id, number: record.number, userId: record.user_id }, record.status);
  return NextResponse.json({ sent: record.status });
}
