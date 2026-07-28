import type { CommerceDatabase } from "./commerce-server";
import type { AppUser } from "./platform-server";

export type OrderAccessRow = {
  id: string;
  customer_email: string;
  status: string;
  payload: string;
  created_at: string;
};

export async function getAccessibleOrder(
  database: CommerceDatabase,
  actor: AppUser,
  orderId: string,
) {
  const order = await database
    .prepare(
      `SELECT id, customer_email, status, payload, created_at
       FROM commerce_orders WHERE id = ? LIMIT 1`,
    )
    .bind(orderId.slice(0, 80))
    .first<OrderAccessRow>();
  if (!order) return null;
  if (
    actor.role === "admin" ||
    order.customer_email.toLowerCase() === actor.email.toLowerCase()
  ) {
    return order;
  }
  if (actor.role === "seller" && actor.sellerId) {
    const item = await database
      .prepare(
        `SELECT id FROM order_items
         WHERE order_id = ? AND seller_id = ? LIMIT 1`,
      )
      .bind(order.id, actor.sellerId)
      .first();
    if (item) return order;
  }
  return null;
}

export function parseOrderPayload(order: OrderAccessRow) {
  try {
    const payload = JSON.parse(order.payload) as Record<string, unknown>;
    return { ...payload, status: order.status };
  } catch {
    return {
      id: order.id,
      status: order.status,
      createdAt: order.created_at,
    };
  }
}
