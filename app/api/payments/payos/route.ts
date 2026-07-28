import { createRecordId } from "../../../lib/commerce-server";
import { getRuntimeSecret } from "../../../lib/commerce-server";
import { calculateIncludedTax, getBusinessProfile } from "../../../lib/invoicing";
import { allocateOrderBySeller } from "../../../lib/marketplace";
import {
  confirmPayOSWebhook,
  createPayOSPayment,
} from "../../../lib/payos-server";
import {
  assertSameOrigin,
  enforceRateLimit,
  errorResponse,
  listCatalog,
  PlatformError,
  recordAudit,
  requireAppUser,
  requireDatabase,
} from "../../../lib/platform-server";
import { cancelPendingOrder } from "../../../lib/order-server";

type CheckoutLine = {
  id?: number;
  quantity?: number;
  variant?: string;
};

type CheckoutBody = {
  items?: CheckoutLine[];
  customer?: {
    name?: string;
    phone?: string;
    provinceCode?: number;
    province?: string;
    wardCode?: number;
    ward?: string;
    addressDetail?: string;
    address?: string;
  };
  shippingMethod?: string;
  shippingNote?: string;
  voucherCode?: string;
};

const SHIPPING_FEES: Record<string, number> = {
  "Tiêu chuẩn": 0,
  Nhanh: 39000,
  "Hỏa tốc": 69000,
};

async function serverDiscount(
  database: Awaited<ReturnType<typeof requireDatabase>>,
  code: string,
  subtotal: number,
  sellerSubtotals: Record<string, number>,
  customerEmail: string,
) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { code: "", discount: 0 };
  if (normalized === "LOPA50" && subtotal >= 499000) {
    return { code: normalized, discount: 50000 };
  }
  if (normalized === "HELLO100" && subtotal >= 1500000) {
    const used = await database
      .prepare(
        `SELECT COUNT(*) AS count FROM voucher_redemptions
         WHERE code = 'HELLO100' AND customer_key = ?`,
      )
      .bind(customerEmail)
      .first<{ count: number }>();
    if (Number(used?.count ?? 0) === 0) {
      return { code: normalized, discount: 100000 };
    }
  }
  const cloudSubtotal = sellerSubtotals["cloud-lifestyle"] ?? 0;
  if (normalized === "CLOUD15" && cloudSubtotal >= 500000) {
    return {
      code: normalized,
      discount: Math.min(120000, Math.round(cloudSubtotal * 0.15)),
    };
  }
  throw new PlatformError(
    "Mã ưu đãi không hợp lệ hoặc chưa đủ điều kiện.",
    400,
  );
}

function createOrderId() {
  const now = new Date();
  return `LP${now
    .toISOString()
    .slice(2, 10)
    .replaceAll("-", "")}${String(now.getTime()).slice(-5)}${Math.floor(
    Math.random() * 10,
  )}`;
}

export async function POST(request: Request) {
  let database: Awaited<ReturnType<typeof requireDatabase>> | null = null;
  let orderCode = 0;
  try {
    assertSameOrigin(request);
    const user = await requireAppUser();
    database = await requireDatabase();
    await enforceRateLimit(database, "payos-create", 12, 10 * 60);
    const body = (await request.json()) as CheckoutBody;
    const requestedItems = Array.isArray(body.items) ? body.items : [];
    if (!requestedItems.length || requestedItems.length > 50) {
      return Response.json(
        { message: "Giỏ hàng không hợp lệ." },
        { status: 400 },
      );
    }
    const catalog = await listCatalog(database);
    const selected = requestedItems.map((requested) => {
      const product = catalog.find(
        (item) => Number(item.id) === Math.trunc(Number(requested.id)),
      );
      const quantity = Math.trunc(Number(requested.quantity));
      if (
        !product ||
        product.status !== "active" ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 99
      ) {
        throw new Error("Một sản phẩm trong giỏ không còn hợp lệ.");
      }
      if (Number(product.available) < quantity) {
        throw new Error(
          `${product.name} chỉ còn ${Number(product.available)} sản phẩm.`,
        );
      }
      return {
        id: Number(product.id),
        name: product.name,
        category: product.category,
        price: Number(product.price),
        oldPrice: Number(product.old_price),
        rating: Number(product.rating),
        sold: String(product.sold_count),
        delivery: Number(product.delivery_days),
        image: product.image_url,
        badge: product.badge ?? undefined,
        description: product.description,
        sellerId: product.seller_id,
        quantity,
        variant: String(requested.variant ?? "Tiêu chuẩn").slice(0, 80),
      };
    });
    const customer = body.customer ?? {};
    const name = String(customer.name ?? user.displayName).trim().slice(0, 120);
    const phone = String(customer.phone ?? user.phone).trim().slice(0, 30);
    const province = String(customer.province ?? "").trim().slice(0, 120);
    const ward = String(customer.ward ?? "").trim().slice(0, 120);
    const addressDetail = String(customer.addressDetail ?? "")
      .trim()
      .slice(0, 300);
    if (!name || !phone || !province || !ward || !addressDetail) {
      return Response.json(
        { message: "Thông tin nhận hàng chưa đầy đủ." },
        { status: 400 },
      );
    }
    const address = [addressDetail, ward, province].join(", ");
    const shippingMethod = Object.hasOwn(
      SHIPPING_FEES,
      body.shippingMethod ?? "",
    )
      ? String(body.shippingMethod)
      : "Tiêu chuẩn";
    const shippingFee = SHIPPING_FEES[shippingMethod];
    const subtotal = selected.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const sellerSubtotals = selected.reduce<Record<string, number>>(
      (totals, item) => {
        totals[item.sellerId] =
          (totals[item.sellerId] ?? 0) + item.price * item.quantity;
        return totals;
      },
      {},
    );
    const voucher = await serverDiscount(
      database,
      String(body.voucherCode ?? ""),
      subtotal,
      sellerSubtotals,
      user.email,
    );
    const total = Math.max(0, subtotal - voucher.discount + shippingFee);
    if (total < 2000) {
      return Response.json(
        { message: "payOS yêu cầu giá trị thanh toán tối thiểu 2.000đ." },
        { status: 400 },
      );
    }
    const orderId = createOrderId();
    orderCode =
      Date.now() * 100 + Math.floor(Math.random() * 100);
    const now = new Date();
    const nowIso = now.toISOString();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
    const invoiceNumber = `LP-${now.getFullYear()}-${orderId}`;
    const business = getBusinessProfile();
    const tax = calculateIncludedTax(total, business.vatRate);
    const allocations = allocateOrderBySeller(
      selected,
      voucher.discount,
      tax.tax,
    );
    const paymentId = createRecordId("payment");
    const shipmentId = createRecordId("shipment");
    const trackingCode = `LOPA${String(orderCode).slice(-12)}`;
    const orderPayload = {
      id: orderId,
      createdAt: nowIso,
      customer: {
        name,
        email: user.email,
        phone,
        provinceCode: customer.provinceCode,
        province,
        wardCode: customer.wardCode,
        ward,
        addressDetail,
        address,
      },
      items: selected.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        oldPrice: item.oldPrice,
        rating: item.rating,
        sold: item.sold,
        delivery: item.delivery,
        image: item.image,
        badge: item.badge,
        description: item.description,
        quantity: item.quantity,
        variant: item.variant,
      })),
      payment: "payOS · VietQR",
      paymentOrderCode: orderCode,
      shippingMethod,
      shippingFee,
      shippingNote: String(body.shippingNote ?? "").slice(0, 500),
      subtotal,
      discount: voucher.discount,
      total,
      status: "Chờ thanh toán",
      voucherCode: voucher.code || undefined,
      amountBeforeTax: tax.beforeTax,
      taxAmount: tax.tax,
      invoiceNumber,
      invoiceStatus: "draft",
      business,
      sellerAllocations: allocations,
      serverPersisted: true,
    };
    const statements = [
      database
        .prepare(
          `INSERT INTO commerce_orders
           (id, customer_email, subtotal, discount, shipping, tax, total,
            voucher_code, invoice_number, status, payload, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Chờ thanh toán', ?, ?)`,
        )
        .bind(
          orderId,
          user.email,
          subtotal,
          voucher.discount,
          shippingFee,
          tax.tax,
          total,
          voucher.code || null,
          invoiceNumber,
          JSON.stringify(orderPayload).slice(0, 100000),
          nowIso,
        ),
      database
        .prepare(
          `INSERT INTO payment_intents
           (id, order_code, order_id, user_email, provider, amount, status,
            payment_link_id, checkout_url, qr_code, provider_reference,
            expires_at, payload, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'payos', ?, 'CREATING', NULL, NULL, NULL, NULL,
            ?, ?, ?, ?)`,
        )
        .bind(
          paymentId,
          orderCode,
          orderId,
          user.email,
          total,
          expiresAt.toISOString(),
          JSON.stringify({ selected, shippingMethod, voucher }).slice(
            0,
            100000,
          ),
          nowIso,
          nowIso,
        ),
      database
        .prepare(
          `INSERT INTO invoices
           (number, order_id, seller_id, subtotal, tax, total, status, payload, created_at)
           VALUES (?, ?, NULL, ?, ?, ?, 'draft', ?, ?)`,
        )
        .bind(
          invoiceNumber,
          orderId,
          tax.beforeTax,
          tax.tax,
          total,
          JSON.stringify({
            business,
            customer: orderPayload.customer,
            items: orderPayload.items,
            allocations,
          }).slice(0, 100000),
          nowIso,
        ),
      database
        .prepare(
          `INSERT INTO shipments
           (id, order_id, seller_id, carrier, tracking_code, status,
            estimated_delivery, shipping_address, created_at, updated_at)
           VALUES (?, ?, NULL, 'LOPA Express', ?, 'Chờ thanh toán', ?, ?, ?, ?)`,
        )
        .bind(
          shipmentId,
          orderId,
          trackingCode,
          new Date(
            now.getTime() +
              (shippingMethod === "Hỏa tốc"
                ? 1
                : shippingMethod === "Nhanh"
                  ? 2
                  : 4) *
                86400000,
          ).toISOString(),
          address,
          nowIso,
          nowIso,
        ),
    ];
    for (const item of selected) {
      statements.push(
        database
          .prepare(
            `UPDATE inventory
             SET available = available - ?, reserved = reserved + ?, updated_at = ?
             WHERE product_id = ?`,
          )
          .bind(item.quantity, item.quantity, nowIso, item.id),
        database
          .prepare(
            `INSERT INTO order_items
             (id, order_id, product_id, seller_id, name, variant, quantity,
              unit_price, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            `${orderId}:${item.id}:${item.variant}`,
            orderId,
            item.id,
            item.sellerId,
            item.name,
            item.variant,
            item.quantity,
            item.price,
            nowIso,
          ),
      );
    }
    for (const allocation of allocations) {
      statements.push(
        database
          .prepare(
            `INSERT INTO seller_ledger
             (id, order_id, seller_id, gross, discount, commission, tax, net,
              status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_payment', ?)`,
          )
          .bind(
            `${orderId}:${allocation.sellerId}`,
            orderId,
            allocation.sellerId,
            allocation.gross,
            allocation.discount,
            allocation.commission,
            allocation.tax,
            allocation.net,
            nowIso,
          ),
      );
    }
    if (voucher.code && voucher.discount > 0) {
      statements.push(
        database
          .prepare(
            `INSERT INTO voucher_redemptions
             (id, code, order_id, customer_key, seller_id, amount, created_at)
             VALUES (?, ?, ?, ?, NULL, ?, ?)`,
          )
          .bind(
            `${orderId}:${voucher.code}`,
            voucher.code,
            orderId,
            user.email,
            voucher.discount,
            nowIso,
          ),
      );
    }
    await database.batch(statements);
    const origin = new URL(request.url).origin;
    const description = `LOPA ${String(orderCode).slice(-10)}`;
    const data = await createPayOSPayment({
      orderCode,
      amount: total,
      description,
      buyerName: name,
      buyerEmail: user.email,
      buyerPhone: phone,
      buyerAddress: address,
      items: selected.map((item) => ({
        name: item.name.slice(0, 80),
        quantity: item.quantity,
        price: item.price,
      })),
      cancelUrl: `${origin}/checkout?payment=cancelled&orderCode=${orderCode}`,
      returnUrl: `${origin}/checkout?payment=success&orderCode=${orderCode}`,
      expiredAt: Math.floor(expiresAt.getTime() / 1000),
    });
    if (
      Number(data.orderCode) !== orderCode ||
      Number(data.amount) !== total
    ) {
      throw new PlatformError(
        "Dữ liệu payOS trả về không khớp với đơn hàng.",
        502,
      );
    }
    await database
      .prepare(
        `UPDATE payment_intents
         SET status = ?, payment_link_id = ?, checkout_url = ?, qr_code = ?,
             payload = ?, updated_at = ? WHERE id = ?`,
      )
      .bind(
        data.status || "PENDING",
        data.paymentLinkId,
        data.checkoutUrl,
        data.qrCode,
        JSON.stringify(data).slice(0, 100000),
        new Date().toISOString(),
        paymentId,
      )
      .run();
    const configuredWebhookUrl =
      (await getRuntimeSecret("PAYOS_WEBHOOK_URL")) ||
      `${origin}/api/payments/payos/webhook`;
    const previousConfirmation = await database
      .prepare(
        `SELECT id FROM audit_logs
         WHERE action = 'payos.webhook.confirmed' AND resource_id = ?
         LIMIT 1`,
      )
      .bind(configuredWebhookUrl)
      .first();
    let webhookConfigured = Boolean(previousConfirmation);
    if (!webhookConfigured) {
      webhookConfigured = await confirmPayOSWebhook(configuredWebhookUrl).catch(
        () => false,
      );
      if (webhookConfigured) {
        await recordAudit(database, {
          actorUserId: user.id,
          action: "payos.webhook.confirmed",
          resourceType: "payment_provider",
          resourceId: configuredWebhookUrl,
        });
      }
    }
    return Response.json(
      {
        orderId,
        orderCode,
        amount: total,
        status: data.status || "PENDING",
        checkoutUrl: data.checkoutUrl,
        qrCode: data.qrCode,
        expiresAt: expiresAt.toISOString(),
        order: orderPayload,
        webhookConfigured,
      },
      { status: 201 },
    );
  } catch (error) {
    if (database && orderCode) {
      await cancelPendingOrder(
        database,
        orderCode,
        error instanceof Error ? error.message : "Không tạo được mã thanh toán.",
        "FAILED",
      ).catch(() => undefined);
    }
    return errorResponse(error);
  }
}
