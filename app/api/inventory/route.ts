import {
  assertSameOrigin,
  errorResponse,
  listCatalog,
  recordAudit,
  requireDatabase,
  requireRole,
} from "../../lib/platform-server";

export async function GET() {
  try {
    const database = await requireDatabase();
    const rows = await listCatalog(database);
    return Response.json({
      configured: true,
      inventory: rows.map((row) => ({
        productId: Number(row.id),
        sellerId: row.seller_id,
        name: row.name,
        image: row.image_url,
        available: Number(row.available),
        reserved: Number(row.reserved),
        lowStockThreshold: Number(row.low_stock_threshold),
        lowStock: Number(row.available) <= Number(row.low_stock_threshold),
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireRole(["seller", "admin"]);
    const database = await requireDatabase();
    const body = (await request.json()) as {
      productId?: number;
      available?: number;
      lowStockThreshold?: number;
    };
    const productId = Math.trunc(Number(body.productId));
    const available = Math.trunc(Number(body.available));
    const lowStockThreshold = Math.trunc(
      Number(body.lowStockThreshold ?? 5),
    );
    if (
      !Number.isInteger(productId) ||
      !Number.isInteger(available) ||
      available < 0 ||
      available > 1_000_000 ||
      lowStockThreshold < 0 ||
      lowStockThreshold > 100_000
    ) {
      return Response.json(
        { message: "Số lượng tồn kho không hợp lệ." },
        { status: 400 },
      );
    }
    const product = await database
      .prepare(
        `SELECT p.seller_id, p.name FROM platform_products p WHERE p.id = ?`,
      )
      .bind(productId)
      .first<{ seller_id: string; name: string }>();
    if (!product) {
      return Response.json(
        { message: "Không tìm thấy sản phẩm." },
        { status: 404 },
      );
    }
    if (
      actor.role === "seller" &&
      (!actor.sellerId || actor.sellerId !== product.seller_id)
    ) {
      return Response.json(
        { message: "Sản phẩm không thuộc gian hàng của bạn." },
        { status: 403 },
      );
    }
    const now = new Date().toISOString();
    await database
      .prepare(
        `UPDATE inventory
         SET available = ?, low_stock_threshold = ?, updated_at = ?
         WHERE product_id = ?`,
      )
      .bind(available, lowStockThreshold, now, productId)
      .run();
    await recordAudit(database, {
      actorUserId: actor.id,
      action: "inventory.updated",
      resourceType: "product",
      resourceId: String(productId),
      payload: { available, lowStockThreshold },
    });
    return Response.json({ ok: true, available, lowStockThreshold });
  } catch (error) {
    return errorResponse(error);
  }
}
