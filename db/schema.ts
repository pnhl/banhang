import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const commerceOrders = sqliteTable(
  "commerce_orders",
  {
    id: text("id").primaryKey(),
    customerEmail: text("customer_email").notNull(),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull().default(0),
    shipping: integer("shipping").notNull().default(0),
    tax: integer("tax").notNull().default(0),
    total: integer("total").notNull(),
    voucherCode: text("voucher_code"),
    invoiceNumber: text("invoice_number").notNull(),
    status: text("status").notNull().default("pending"),
    payload: text("payload").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("commerce_orders_created_at_idx").on(table.createdAt),
    index("commerce_orders_customer_email_idx").on(table.customerEmail),
  ],
);

export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: text("id").primaryKey(),
    eventName: text("event_name").notNull(),
    sessionId: text("session_id").notNull(),
    userKey: text("user_key"),
    orderId: text("order_id"),
    sellerId: text("seller_id"),
    value: real("value").notNull().default(0),
    currency: text("currency").notNull().default("VND"),
    payload: text("payload").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("analytics_events_name_created_idx").on(
      table.eventName,
      table.createdAt,
    ),
    index("analytics_events_session_idx").on(table.sessionId),
  ],
);

export const sellerLedger = sqliteTable(
  "seller_ledger",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull(),
    sellerId: text("seller_id").notNull(),
    gross: integer("gross").notNull(),
    discount: integer("discount").notNull().default(0),
    commission: integer("commission").notNull().default(0),
    tax: integer("tax").notNull().default(0),
    net: integer("net").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("seller_ledger_seller_status_idx").on(
      table.sellerId,
      table.status,
    ),
    index("seller_ledger_order_idx").on(table.orderId),
  ],
);

export const voucherRedemptions = sqliteTable(
  "voucher_redemptions",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    orderId: text("order_id").notNull(),
    customerKey: text("customer_key").notNull(),
    sellerId: text("seller_id"),
    amount: integer("amount").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("voucher_redemptions_code_idx").on(table.code),
    index("voucher_redemptions_customer_idx").on(
      table.code,
      table.customerKey,
    ),
  ],
);

export const invoices = sqliteTable(
  "invoices",
  {
    number: text("number").primaryKey(),
    orderId: text("order_id").notNull(),
    sellerId: text("seller_id"),
    subtotal: integer("subtotal").notNull(),
    tax: integer("tax").notNull(),
    total: integer("total").notNull(),
    status: text("status").notNull().default("draft"),
    payload: text("payload").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("invoices_order_idx").on(table.orderId),
    index("invoices_seller_idx").on(table.sellerId),
  ],
);

export const sellerSettlements = sqliteTable(
  "seller_settlements",
  {
    id: text("id").primaryKey(),
    sellerId: text("seller_id").notNull(),
    amount: integer("amount").notNull(),
    orderCount: integer("order_count").notNull(),
    status: text("status").notNull().default("paid"),
    periodStart: text("period_start").notNull(),
    periodEnd: text("period_end").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("seller_settlements_seller_idx").on(
      table.sellerId,
      table.createdAt,
    ),
  ],
);
