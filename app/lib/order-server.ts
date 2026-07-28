import type { CommerceDatabase } from "./commerce-server";
import { createRecordId } from "./commerce-server";
import {
  notificationStatement,
  PlatformError,
  recordAudit,
} from "./platform-server";

export type PaymentIntentRow = {
  id: string;
  order_code: number;
  order_id: string;
  user_email: string;
  amount: number;
  status: string;
  payment_link_id: string | null;
  checkout_url: string | null;
  qr_code: string | null;
  provider_reference: string | null;
  expires_at: string | null;
  payload: string;
  created_at: string;
  updated_at: string;
};

async function paymentUserId(
  database: CommerceDatabase,
  email: string,
) {
  const user = await database
    .prepare(`SELECT id FROM app_users WHERE email = ? LIMIT 1`)
    .bind(email)
    .first<{ id: string }>();
  return user?.id ?? null;
}

export async function getPaymentIntent(
  database: CommerceDatabase,
  orderCode: number,
) {
  return database
    .prepare(
      `SELECT id, order_code, order_id, user_email, amount, status,
       payment_link_id, checkout_url, qr_code, provider_reference,
       expires_at, payload, created_at, updated_at
       FROM payment_intents WHERE order_code = ? LIMIT 1`,
    )
    .bind(orderCode)
    .first<PaymentIntentRow>();
}

export async function finalizePaidOrder(
  database: CommerceDatabase,
  orderCode: number,
  providerReference?: string,
) {
  const payment = await getPaymentIntent(database, orderCode);
  if (!payment) return null;
  if (payment.status === "PAID") return payment;
  if (!["PENDING", "CREATING"].includes(payment.status)) {
    throw new PlatformError(
      `Không thể xác nhận thanh toán từ trạng thái ${payment.status}.`,
      409,
    );
  }
  const items = await database
    .prepare(
      `SELECT product_id, quantity FROM order_items WHERE order_id = ?`,
    )
    .bind(payment.order_id)
    .all<{ product_id: number; quantity: number }>();
  const userId = await paymentUserId(database, payment.user_email);
  const now = new Date().toISOString();
  const shipment = await database
    .prepare(`SELECT id FROM shipments WHERE order_id = ?`)
    .bind(payment.order_id)
    .first<{ id: string }>();
  const statements = [
    database
      .prepare(
        `UPDATE payment_intents
         SET status = 'PAID', provider_reference = ?, updated_at = ?
         WHERE id = ? AND status IN ('PENDING', 'CREATING')`,
      )
      .bind(providerReference?.slice(0, 160) ?? null, now, payment.id),
    database
      .prepare(
        `UPDATE commerce_orders SET status = 'Chờ xác nhận' WHERE id = ?`,
      )
      .bind(payment.order_id),
    database
      .prepare(
        `UPDATE seller_ledger SET status = 'pending' WHERE order_id = ?`,
      )
      .bind(payment.order_id),
    database
      .prepare(`UPDATE invoices SET status = 'paid' WHERE order_id = ?`)
      .bind(payment.order_id),
    database
      .prepare(
        `UPDATE shipments
         SET status = 'Chờ xác nhận', updated_at = ? WHERE order_id = ?`,
      )
      .bind(now, payment.order_id),
  ];
  for (const item of items.results ?? []) {
    statements.push(
      database
        .prepare(
          `UPDATE inventory
           SET reserved = reserved - ?, sold = sold + ?, updated_at = ?
           WHERE product_id = ?`,
        )
        .bind(
          Number(item.quantity),
          Number(item.quantity),
          now,
          Number(item.product_id),
        ),
    );
  }
  if (shipment) {
    statements.push(
      database
        .prepare(
          `INSERT INTO shipping_events
           (id, shipment_id, status, location, note, created_by, created_at)
           VALUES (?, ?, 'Chờ xác nhận', NULL, ?, 'payos-webhook', ?)`,
        )
        .bind(
          createRecordId("shipping-event"),
          shipment.id,
          "Thanh toán đã được xác nhận, đơn hàng chuyển sang khâu xử lý.",
          now,
        ),
    );
  }
  if (userId) {
    statements.push(
      notificationStatement(database, {
        userId,
        type: "payment",
        title: "Thanh toán thành công",
        message: `Đơn #${payment.order_id} đã được payOS xác nhận.`,
        actionUrl: `/orders/${payment.order_id}`,
      }),
    );
  }
  await database.batch(statements);
  for (const item of items.results ?? []) {
    const stock = await database
      .prepare(
        `SELECT i.available, i.low_stock_threshold, i.seller_id, p.name
         FROM inventory i JOIN platform_products p ON p.id = i.product_id
         WHERE i.product_id = ?`,
      )
      .bind(Number(item.product_id))
      .first<{
        available: number;
        low_stock_threshold: number;
        seller_id: string;
        name: string;
      }>();
    if (!stock) continue;
    const sellerUsers = await database
      .prepare(
        `SELECT id FROM app_users
         WHERE seller_id = ? AND role IN ('seller', 'admin') AND status = 'active'`,
      )
      .bind(stock.seller_id)
      .all<{ id: string }>();
    for (const sellerUser of sellerUsers.results ?? []) {
      await notificationStatement(database, {
        userId: sellerUser.id,
        type:
          Number(stock.available) <= Number(stock.low_stock_threshold)
            ? "inventory"
            : "order",
        title:
          Number(stock.available) <= Number(stock.low_stock_threshold)
            ? "Cảnh báo tồn kho thấp"
            : "Có đơn hàng đã thanh toán",
        message:
          Number(stock.available) <= Number(stock.low_stock_threshold)
            ? `${stock.name} chỉ còn ${Number(stock.available)} sản phẩm có thể bán.`
            : `Đơn #${payment.order_id} có sản phẩm ${stock.name}.`,
        actionUrl: "/seller/operations",
      }).run();
    }
  }
  await recordAudit(database, {
    actorUserId: userId,
    action: "payment.paid",
    resourceType: "payment",
    resourceId: payment.id,
    payload: { orderCode, providerReference },
  });
  return { ...payment, status: "PAID", updated_at: now };
}

export async function cancelPendingOrder(
  database: CommerceDatabase,
  orderCode: number,
  reason: string,
  nextStatus: "CANCELLED" | "EXPIRED" | "FAILED" = "CANCELLED",
) {
  const payment = await getPaymentIntent(database, orderCode);
  if (!payment) return null;
  if (["CANCELLED", "EXPIRED", "FAILED"].includes(payment.status)) {
    return payment;
  }
  if (payment.status === "PAID") {
    throw new PlatformError(
      "Đơn đã thanh toán; hãy dùng quy trình hoàn tiền.",
      409,
    );
  }
  const items = await database
    .prepare(
      `SELECT product_id, quantity FROM order_items WHERE order_id = ?`,
    )
    .bind(payment.order_id)
    .all<{ product_id: number; quantity: number }>();
  const userId = await paymentUserId(database, payment.user_email);
  const now = new Date().toISOString();
  const shipment = await database
    .prepare(`SELECT id FROM shipments WHERE order_id = ?`)
    .bind(payment.order_id)
    .first<{ id: string }>();
  const statements = [
    database
      .prepare(
        `UPDATE payment_intents SET status = ?, updated_at = ?
         WHERE id = ? AND status IN ('CREATING', 'PENDING')`,
      )
      .bind(nextStatus, now, payment.id),
    database
      .prepare(`UPDATE commerce_orders SET status = 'Đã hủy' WHERE id = ?`)
      .bind(payment.order_id),
    database
      .prepare(
        `UPDATE seller_ledger SET status = 'cancelled' WHERE order_id = ?`,
      )
      .bind(payment.order_id),
    database
      .prepare(`UPDATE invoices SET status = 'cancelled' WHERE order_id = ?`)
      .bind(payment.order_id),
    database
      .prepare(`DELETE FROM voucher_redemptions WHERE order_id = ?`)
      .bind(payment.order_id),
    database
      .prepare(
        `UPDATE shipments SET status = 'Đã hủy', updated_at = ?
         WHERE order_id = ?`,
      )
      .bind(now, payment.order_id),
  ];
  for (const item of items.results ?? []) {
    statements.push(
      database
        .prepare(
          `UPDATE inventory
           SET available = available + ?, reserved = reserved - ?, updated_at = ?
           WHERE product_id = ?`,
        )
        .bind(
          Number(item.quantity),
          Number(item.quantity),
          now,
          Number(item.product_id),
        ),
    );
  }
  if (shipment) {
    statements.push(
      database
        .prepare(
          `INSERT INTO shipping_events
           (id, shipment_id, status, location, note, created_by, created_at)
           VALUES (?, ?, 'Đã hủy', NULL, ?, 'system', ?)`,
        )
        .bind(
          createRecordId("shipping-event"),
          shipment.id,
          reason.slice(0, 400),
          now,
        ),
    );
  }
  if (userId) {
    statements.push(
      notificationStatement(database, {
        userId,
        type: "payment",
        title:
          nextStatus === "EXPIRED"
            ? "Mã thanh toán đã hết hạn"
            : "Đơn thanh toán đã được hủy",
        message: `Đơn #${payment.order_id}: ${reason.slice(0, 260)}`,
        actionUrl: `/orders/${payment.order_id}`,
      }),
    );
  }
  await database.batch(statements);
  await recordAudit(database, {
    actorUserId: userId,
    action: `payment.${nextStatus.toLowerCase()}`,
    resourceType: "payment",
    resourceId: payment.id,
    payload: { orderCode, reason },
  });
  return { ...payment, status: nextStatus, updated_at: now };
}

export function publicPaymentState(payment: PaymentIntentRow) {
  return {
    orderId: payment.order_id,
    orderCode: Number(payment.order_code),
    amount: Number(payment.amount),
    status: payment.status,
    checkoutUrl: payment.checkout_url,
    qrCode: payment.qr_code,
    expiresAt: payment.expires_at,
    createdAt: payment.created_at,
    updatedAt: payment.updated_at,
  };
}
