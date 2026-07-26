import { NextResponse } from "next/server";
import {
  createRecordId,
  getCommerceDatabase,
} from "../../../lib/commerce-server";

const allowedEvents = new Set([
  "view_item",
  "view_item_list",
  "search",
  "add_to_cart",
  "view_cart",
  "begin_checkout",
  "add_shipping_info",
  "add_payment_info",
  "purchase",
  "select_promotion",
  "view_store",
]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    params?: Record<string, unknown>;
    createdAt?: string;
    sessionId?: string;
  } | null;
  if (
    !body ||
    !body.name ||
    !allowedEvents.has(body.name) ||
    !body.sessionId ||
    body.sessionId.length > 100
  ) {
    return NextResponse.json(
      { message: "Sự kiện không hợp lệ." },
      { status: 400 },
    );
  }

  const database = await getCommerceDatabase();
  if (!database) {
    return NextResponse.json({ accepted: true, persisted: false });
  }

  const params = body.params ?? {};
  const createdAt = body.createdAt ?? new Date().toISOString();
  await database
    .prepare(
      `INSERT INTO analytics_events
      (id, event_name, session_id, user_key, order_id, seller_id, value, currency, payload, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      createRecordId("evt"),
      body.name,
      body.sessionId.slice(0, 100),
      String(params.user_key ?? "").slice(0, 160) || null,
      String(params.transaction_id ?? "").slice(0, 80) || null,
      String(params.seller_id ?? "").slice(0, 80) || null,
      Number(params.value ?? 0) || 0,
      String(params.currency ?? "VND").slice(0, 8),
      JSON.stringify(params).slice(0, 12000),
      createdAt,
    )
    .run();

  return NextResponse.json({ accepted: true, persisted: true });
}
