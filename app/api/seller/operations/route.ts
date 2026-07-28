import {
  errorResponse,
  listCatalog,
  requireDatabase,
  requireRole,
} from "../../../lib/platform-server";

export async function GET() {
  try {
    const actor = await requireRole(["seller", "admin"]);
    const database = await requireDatabase();
    const catalog = await listCatalog(database);
    const sellerWhere =
      actor.role === "seller" && actor.sellerId
        ? { sql: " WHERE s.seller_id = ?", value: actor.sellerId }
        : { sql: "", value: null };
    const shipments = sellerWhere.value
      ? await database
          .prepare(
            `SELECT s.id, s.order_id, s.carrier, s.tracking_code, s.status,
             s.estimated_delivery, s.updated_at
             FROM shipments s
             JOIN order_items i ON i.order_id = s.order_id
             WHERE i.seller_id = ?
             GROUP BY s.id ORDER BY s.updated_at DESC LIMIT 100`,
          )
          .bind(sellerWhere.value)
          .all()
      : await database
          .prepare(
            `SELECT id, order_id, carrier, tracking_code, status,
             estimated_delivery, updated_at
             FROM shipments ORDER BY updated_at DESC LIMIT 100`,
          )
          .all();
    const returns = sellerWhere.value
      ? await database
          .prepare(
            `SELECT r.id, r.order_id, r.reason, r.details, r.status,
             r.resolution, r.refund_amount, r.created_at, r.updated_at
             FROM return_requests r
             JOIN order_items i ON i.order_id = r.order_id
             WHERE i.seller_id = ?
             GROUP BY r.id ORDER BY r.updated_at DESC LIMIT 100`,
          )
          .bind(sellerWhere.value)
          .all()
      : await database
          .prepare(
            `SELECT id, order_id, reason, details, status, resolution,
             refund_amount, created_at, updated_at
             FROM return_requests ORDER BY updated_at DESC LIMIT 100`,
          )
          .all();
    const applications =
      actor.role === "admin"
        ? await database
            .prepare(
              `SELECT id, user_id, email, shop_name, business_type, tax_code,
               phone, description, status, reviewer_note, created_at, updated_at
               FROM seller_applications ORDER BY created_at DESC LIMIT 100`,
            )
            .all()
        : { results: [] };
    return Response.json({
      role: actor.role,
      sellerId: actor.sellerId,
      inventory: catalog
        .filter(
          (item) =>
            actor.role === "admin" || item.seller_id === actor.sellerId,
        )
        .map((item) => ({
          productId: Number(item.id),
          name: item.name,
          image: item.image_url,
          available: Number(item.available),
          reserved: Number(item.reserved),
          lowStockThreshold: Number(item.low_stock_threshold),
        })),
      shipments: shipments.results ?? [],
      returns: returns.results ?? [],
      applications: applications.results ?? [],
    });
  } catch (error) {
    return errorResponse(error);
  }
}
