import { products } from "../../lib/catalog";
import {
  assertSameOrigin,
  errorResponse,
  listCatalog,
  recordAudit,
  requireDatabase,
  requireRole,
  type CatalogRow,
} from "../../lib/platform-server";

const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const toPublicProduct = (row: CatalogRow) => ({
  id: Number(row.id),
  sellerId: row.seller_id,
  name: row.name,
  category: row.category,
  price: Number(row.price),
  oldPrice: Number(row.old_price),
  rating: Number(row.rating),
  sold: Number(row.sold_count),
  delivery: Number(row.delivery_days),
  image: row.image_url,
  badge: row.badge,
  description: row.description,
  status: row.status,
  stock: Number(row.available),
  reserved: Number(row.reserved),
  lowStockThreshold: Number(row.low_stock_threshold),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = normalizeSearch(url.searchParams.get("q") ?? "");
  const category = normalizeSearch(url.searchParams.get("category") ?? "");
  const sellerId = url.searchParams.get("sellerId") ?? "";
  try {
    const database = await requireDatabase();
    const rows = (await listCatalog(database))
      .filter((row) => row.status === "active")
      .map(toPublicProduct);
    const ranked = rows
      .map((product) => {
        const name = normalizeSearch(product.name);
        const haystack = normalizeSearch(
          `${product.name} ${product.category} ${product.description}`,
        );
        let score = 0;
        if (!query) score = product.rating * 10 + Math.min(product.sold, 10000) / 1000;
        else if (name === query) score = 100;
        else if (name.startsWith(query)) score = 75;
        else if (name.includes(query)) score = 55;
        else if (haystack.includes(query)) score = 30;
        for (const token of query.split(/\s+/).filter(Boolean)) {
          if (name.includes(token)) score += 8;
          else if (haystack.includes(token)) score += 3;
        }
        return { product, score };
      })
      .filter(
        ({ product, score }) =>
          (!query || score > 0) &&
          (!category || normalizeSearch(product.category) === category) &&
          (!sellerId || product.sellerId === sellerId),
      )
      .sort(
        (left, right) =>
          right.score - left.score ||
          right.product.rating - left.product.rating,
      );
    const result = ranked.map(({ product }) => product);
    const recommendationPool = rows
      .filter(
        (product) =>
          !result.some((item) => item.id === product.id) &&
          (result[0]
            ? product.category === result[0].category ||
              product.sellerId === result[0].sellerId
            : true),
      )
      .sort((a, b) => b.rating - a.rating || b.sold - a.sold)
      .slice(0, 6);
    return Response.json({
      configured: true,
      query: url.searchParams.get("q") ?? "",
      products: result,
      recommendations: recommendationPool,
    });
  } catch {
    const fallback = products.filter((product) =>
      normalizeSearch(`${product.name} ${product.category} ${product.description}`)
        .includes(query),
    );
    return Response.json({
      configured: false,
      query: url.searchParams.get("q") ?? "",
      products: fallback.map((product) => ({ ...product, stock: 0 })),
      recommendations: products
        .filter((product) => !fallback.some((item) => item.id === product.id))
        .slice(0, 6)
        .map((product) => ({ ...product, stock: 0 })),
    });
  }
}

function validImageUrl(value: string) {
  return (
    value.startsWith("/media/") ||
    value.startsWith("https://") ||
    value.startsWith("http://localhost")
  );
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireRole(["seller", "admin"]);
    const database = await requireDatabase();
    const body = (await request.json()) as {
      sellerId?: string;
      name?: string;
      category?: string;
      price?: number;
      oldPrice?: number;
      deliveryDays?: number;
      imageUrl?: string;
      badge?: string;
      description?: string;
      stock?: number;
    };
    const name = String(body.name ?? "").trim().slice(0, 160);
    const category = String(body.category ?? "").trim().slice(0, 80);
    const description = String(body.description ?? "").trim().slice(0, 1500);
    const imageUrl = String(body.imageUrl ?? "").trim().slice(0, 1000);
    const price = Math.trunc(Number(body.price));
    const oldPrice = Math.max(price, Math.trunc(Number(body.oldPrice ?? price)));
    const deliveryDays = Math.max(
      1,
      Math.min(30, Math.trunc(Number(body.deliveryDays ?? 3))),
    );
    const stock = Math.max(
      0,
      Math.min(1_000_000, Math.trunc(Number(body.stock ?? 0))),
    );
    if (
      !name ||
      !category ||
      description.length < 20 ||
      !validImageUrl(imageUrl) ||
      !Number.isInteger(price) ||
      price < 0
    ) {
      return Response.json(
        {
          message:
            "Tên, danh mục, giá, ảnh và mô tả ít nhất 20 ký tự là bắt buộc.",
        },
        { status: 400 },
      );
    }
    const sellerId =
      actor.role === "seller"
        ? actor.sellerId
        : String(body.sellerId ?? actor.sellerId ?? "nova-digital")
            .trim()
            .slice(0, 100);
    if (!sellerId) {
      return Response.json(
        { message: "Tài khoản chưa được gắn với gian hàng." },
        { status: 409 },
      );
    }
    const id = Date.now();
    const slug = `${normalizeSearch(name).replace(/[^a-z0-9]+/g, "-")}-${id}`;
    const now = new Date().toISOString();
    await database.batch([
      database
        .prepare(
          `INSERT INTO platform_products
           (id, seller_id, name, slug, category, price, old_price, rating,
            sold_count, delivery_days, image_url, badge, description, status,
            created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, 'active', ?, ?)`,
        )
        .bind(
          id,
          sellerId,
          name,
          slug,
          category,
          price,
          oldPrice,
          deliveryDays,
          imageUrl,
          String(body.badge ?? "").trim().slice(0, 40) || null,
          description,
          now,
          now,
        ),
      database
        .prepare(
          `INSERT INTO inventory
           (product_id, seller_id, available, reserved, sold,
            low_stock_threshold, updated_at)
           VALUES (?, ?, ?, 0, 0, 5, ?)`,
        )
        .bind(id, sellerId, stock, now),
    ]);
    await recordAudit(database, {
      actorUserId: actor.id,
      action: "product.created",
      resourceType: "product",
      resourceId: String(id),
      payload: { sellerId, name, price, stock },
    });
    return Response.json({ ok: true, id, slug }, { status: 201 });
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
      id?: number;
      name?: string;
      category?: string;
      price?: number;
      oldPrice?: number;
      deliveryDays?: number;
      imageUrl?: string;
      badge?: string;
      description?: string;
      status?: "active" | "archived";
    };
    const id = Math.trunc(Number(body.id));
    const current = await database
      .prepare(`SELECT seller_id FROM platform_products WHERE id = ?`)
      .bind(id)
      .first<{ seller_id: string }>();
    if (!current) {
      return Response.json(
        { message: "Không tìm thấy sản phẩm." },
        { status: 404 },
      );
    }
    if (
      actor.role === "seller" &&
      (!actor.sellerId || actor.sellerId !== current.seller_id)
    ) {
      return Response.json(
        { message: "Sản phẩm không thuộc gian hàng của bạn." },
        { status: 403 },
      );
    }
    if (body.imageUrl && !validImageUrl(String(body.imageUrl))) {
      return Response.json(
        { message: "URL ảnh không hợp lệ." },
        { status: 400 },
      );
    }
    await database
      .prepare(
        `UPDATE platform_products SET
         name = COALESCE(?, name),
         category = COALESCE(?, category),
         price = COALESCE(?, price),
         old_price = COALESCE(?, old_price),
         delivery_days = COALESCE(?, delivery_days),
         image_url = COALESCE(?, image_url),
         badge = COALESCE(?, badge),
         description = COALESCE(?, description),
         status = COALESCE(?, status),
         updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        body.name ? String(body.name).trim().slice(0, 160) : null,
        body.category ? String(body.category).trim().slice(0, 80) : null,
        Number.isFinite(Number(body.price))
          ? Math.max(0, Math.trunc(Number(body.price)))
          : null,
        Number.isFinite(Number(body.oldPrice))
          ? Math.max(0, Math.trunc(Number(body.oldPrice)))
          : null,
        Number.isFinite(Number(body.deliveryDays))
          ? Math.max(1, Math.min(30, Math.trunc(Number(body.deliveryDays))))
          : null,
        body.imageUrl ? String(body.imageUrl).trim().slice(0, 1000) : null,
        body.badge ? String(body.badge).trim().slice(0, 40) : null,
        body.description
          ? String(body.description).trim().slice(0, 1500)
          : null,
        body.status ?? null,
        new Date().toISOString(),
        id,
      )
      .run();
    await recordAudit(database, {
      actorUserId: actor.id,
      action: "product.updated",
      resourceType: "product",
      resourceId: String(id),
      payload: { status: body.status },
    });
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
