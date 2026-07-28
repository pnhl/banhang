import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
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

export const appUsers = sqliteTable(
  "app_users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    phone: text("phone"),
    role: text("role").notNull().default("customer"),
    status: text("status").notNull().default("active"),
    sellerId: text("seller_id"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("app_users_email_unique").on(table.email),
    index("app_users_role_status_idx").on(table.role, table.status),
    index("app_users_seller_idx").on(table.sellerId),
    check(
      "app_users_role_check",
      sql`${table.role} IN ('customer', 'seller', 'admin')`,
    ),
    check(
      "app_users_status_check",
      sql`${table.status} IN ('active', 'suspended')`,
    ),
  ],
);

export const userAddresses = sqliteTable(
  "user_addresses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    label: text("label").notNull().default("Mặc định"),
    recipientName: text("recipient_name").notNull(),
    phone: text("phone").notNull(),
    provinceCode: integer("province_code"),
    province: text("province").notNull(),
    wardCode: integer("ward_code"),
    ward: text("ward").notNull(),
    addressDetail: text("address_detail").notNull(),
    isDefault: integer("is_default").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("user_addresses_user_idx").on(table.userId, table.isDefault),
  ],
);

export const platformProducts = sqliteTable(
  "platform_products",
  {
    id: integer("id").primaryKey(),
    sellerId: text("seller_id").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    category: text("category").notNull(),
    price: integer("price").notNull(),
    oldPrice: integer("old_price").notNull(),
    rating: real("rating").notNull().default(0),
    soldCount: integer("sold_count").notNull().default(0),
    deliveryDays: integer("delivery_days").notNull().default(3),
    imageUrl: text("image_url").notNull(),
    badge: text("badge"),
    description: text("description").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("platform_products_slug_unique").on(table.slug),
    index("platform_products_category_status_idx").on(
      table.category,
      table.status,
    ),
    index("platform_products_seller_status_idx").on(
      table.sellerId,
      table.status,
    ),
    check(
      "platform_products_price_check",
      sql`${table.price} >= 0 AND ${table.oldPrice} >= 0`,
    ),
  ],
);

export const inventory = sqliteTable(
  "inventory",
  {
    productId: integer("product_id").primaryKey(),
    sellerId: text("seller_id").notNull(),
    available: integer("available").notNull().default(0),
    reserved: integer("reserved").notNull().default(0),
    sold: integer("sold").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("inventory_seller_idx").on(table.sellerId),
    index("inventory_available_idx").on(table.available),
    check(
      "inventory_non_negative_check",
      sql`${table.available} >= 0 AND ${table.reserved} >= 0 AND ${table.sold} >= 0`,
    ),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull(),
    productId: integer("product_id").notNull(),
    sellerId: text("seller_id").notNull(),
    name: text("name").notNull(),
    variant: text("variant"),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    index("order_items_seller_idx").on(table.sellerId, table.orderId),
    check(
      "order_items_quantity_price_check",
      sql`${table.quantity} > 0 AND ${table.unitPrice} >= 0`,
    ),
  ],
);

export const paymentIntents = sqliteTable(
  "payment_intents",
  {
    id: text("id").primaryKey(),
    orderCode: integer("order_code").notNull(),
    orderId: text("order_id").notNull(),
    userEmail: text("user_email").notNull(),
    provider: text("provider").notNull().default("payos"),
    amount: integer("amount").notNull(),
    status: text("status").notNull().default("CREATING"),
    paymentLinkId: text("payment_link_id"),
    checkoutUrl: text("checkout_url"),
    qrCode: text("qr_code"),
    providerReference: text("provider_reference"),
    expiresAt: text("expires_at"),
    payload: text("payload").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("payment_intents_order_code_unique").on(table.orderCode),
    uniqueIndex("payment_intents_order_id_unique").on(table.orderId),
    index("payment_intents_user_status_idx").on(
      table.userEmail,
      table.status,
    ),
    check("payment_intents_amount_check", sql`${table.amount} >= 0`),
  ],
);

export const mediaAssets = sqliteTable(
  "media_assets",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    sellerId: text("seller_id"),
    r2Key: text("r2_key").notNull(),
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    altText: text("alt_text"),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("media_assets_r2_key_unique").on(table.r2Key),
    index("media_assets_owner_idx").on(table.ownerUserId, table.createdAt),
    index("media_assets_seller_idx").on(table.sellerId, table.createdAt),
    check("media_assets_size_check", sql`${table.byteSize} >= 0`),
  ],
);

export const shipments = sqliteTable(
  "shipments",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull(),
    sellerId: text("seller_id"),
    carrier: text("carrier").notNull().default("LOPA Express"),
    trackingCode: text("tracking_code").notNull(),
    status: text("status").notNull().default("Chờ thanh toán"),
    estimatedDelivery: text("estimated_delivery"),
    shippingAddress: text("shipping_address").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("shipments_order_unique").on(table.orderId),
    uniqueIndex("shipments_tracking_code_unique").on(table.trackingCode),
    index("shipments_seller_status_idx").on(table.sellerId, table.status),
  ],
);

export const shippingEvents = sqliteTable(
  "shipping_events",
  {
    id: text("id").primaryKey(),
    shipmentId: text("shipment_id").notNull(),
    status: text("status").notNull(),
    location: text("location"),
    note: text("note").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("shipping_events_shipment_idx").on(
      table.shipmentId,
      table.createdAt,
    ),
  ],
);

export const returnRequests = sqliteTable(
  "return_requests",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull(),
    requesterUserId: text("requester_user_id").notNull(),
    sellerId: text("seller_id"),
    reason: text("reason").notNull(),
    details: text("details").notNull(),
    evidenceMediaId: text("evidence_media_id"),
    status: text("status").notNull().default("submitted"),
    resolution: text("resolution"),
    refundAmount: integer("refund_amount").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("return_requests_order_idx").on(table.orderId),
    index("return_requests_seller_status_idx").on(
      table.sellerId,
      table.status,
    ),
    check(
      "return_requests_refund_check",
      sql`${table.refundAmount} >= 0`,
    ),
  ],
);

export const sellerApplications = sqliteTable(
  "seller_applications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    email: text("email").notNull(),
    shopName: text("shop_name").notNull(),
    businessType: text("business_type").notNull(),
    taxCode: text("tax_code"),
    phone: text("phone").notNull(),
    description: text("description").notNull(),
    status: text("status").notNull().default("submitted"),
    reviewerNote: text("reviewer_note"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("seller_applications_user_unique").on(table.userId),
    index("seller_applications_status_idx").on(table.status, table.createdAt),
  ],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    actionUrl: text("action_url"),
    readAt: text("read_at"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("notifications_user_read_idx").on(
      table.userId,
      table.readAt,
      table.createdAt,
    ),
  ],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id"),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id"),
    ipHash: text("ip_hash"),
    payload: text("payload").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("audit_logs_resource_idx").on(
      table.resourceType,
      table.resourceId,
    ),
    index("audit_logs_actor_created_idx").on(
      table.actorUserId,
      table.createdAt,
    ),
  ],
);

export const rateLimits = sqliteTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull().default(0),
    resetAt: text("reset_at").notNull(),
  },
  (table) => [
    index("rate_limits_reset_idx").on(table.resetAt),
    check("rate_limits_count_check", sql`${table.count} >= 0`),
  ],
);
