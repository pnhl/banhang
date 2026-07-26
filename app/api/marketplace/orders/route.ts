import { NextResponse } from "next/server";
import type { NovaOrder } from "../../../lib/account";
import { getCommerceDatabase } from "../../../lib/commerce-server";

function isOrder(value: unknown): value is NovaOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<NovaOrder>;
  return (
    typeof order.id === "string" &&
    order.id.length <= 80 &&
    typeof order.total === "number" &&
    order.total >= 0 &&
    Array.isArray(order.items) &&
    order.items.length > 0 &&
    order.items.length <= 100 &&
    typeof order.customer?.email === "string"
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    order?: unknown;
  } | null;
  if (!body || !isOrder(body.order)) {
    return NextResponse.json(
      { message: "Đơn hàng không hợp lệ." },
      { status: 400 },
    );
  }

  const order = body.order;
  const database = await getCommerceDatabase();
  if (!database) {
    return NextResponse.json({ accepted: true, persisted: false });
  }

  const createdAt = order.createdAt || new Date().toISOString();
  const statements = [
    database
      .prepare(
        `INSERT OR REPLACE INTO commerce_orders
        (id, customer_email, subtotal, discount, shipping, tax, total, voucher_code, invoice_number, status, payload, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        order.id,
        order.customer.email.slice(0, 200),
        Math.round(order.subtotal),
        Math.round(order.discount),
        Math.round(order.shippingFee ?? 0),
        Math.round(order.taxAmount ?? 0),
        Math.round(order.total),
        order.voucherCode?.slice(0, 40) || null,
        order.invoiceNumber ?? order.id,
        order.status,
        JSON.stringify(order).slice(0, 100000),
        createdAt,
      ),
    database
      .prepare(
        `INSERT OR REPLACE INTO invoices
        (number, order_id, seller_id, subtotal, tax, total, status, payload, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        order.invoiceNumber ?? order.id,
        order.id,
        null,
        Math.round(order.amountBeforeTax ?? order.total),
        Math.round(order.taxAmount ?? 0),
        Math.round(order.total),
        order.invoiceStatus ?? "issued-demo",
        JSON.stringify({
          business: order.business,
          customer: order.customer,
          items: order.items,
          allocations: order.sellerAllocations,
        }).slice(0, 100000),
        createdAt,
      ),
  ];

  for (const allocation of order.sellerAllocations ?? []) {
    statements.push(
      database
        .prepare(
          `INSERT OR REPLACE INTO seller_ledger
          (id, order_id, seller_id, gross, discount, commission, tax, net, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          `${order.id}:${allocation.sellerId}`,
          order.id,
          allocation.sellerId,
          Math.round(allocation.gross),
          Math.round(allocation.discount),
          Math.round(allocation.commission),
          Math.round(allocation.tax),
          Math.round(allocation.net),
          "pending",
          createdAt,
        ),
    );
  }

  if (order.voucherCode && order.discount > 0) {
    statements.push(
      database
        .prepare(
          `INSERT OR REPLACE INTO voucher_redemptions
          (id, code, order_id, customer_key, seller_id, amount, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          `${order.id}:${order.voucherCode}`,
          order.voucherCode,
          order.id,
          order.customer.email.toLowerCase().slice(0, 200),
          null,
          Math.round(order.discount),
          createdAt,
        ),
    );
  }

  await database.batch(statements);
  return NextResponse.json({ accepted: true, persisted: true });
}
