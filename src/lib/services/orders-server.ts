import "server-only";
import { createClient } from "../supabase/server";
import { ORDER_COLUMNS, toOrder, type OrderRow } from "../supabase/mappers";
import type { Order } from "../types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Fetch an order the signed-in user owns. RLS returns nothing for anyone else. */
export async function getOrder(id: string): Promise<Order | null> {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select(ORDER_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Order query failed: ${error.message}`);
  return data ? toOrder(data as unknown as OrderRow) : null;
}

export async function getMyOrders(limit = 20): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Orders query failed: ${error.message}`);
  return (data as unknown as OrderRow[]).map(toOrder);
}
