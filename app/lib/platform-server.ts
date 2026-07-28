import { cookies, headers } from "next/headers";
import { getChatGPTUser } from "../chatgpt-auth";
import {
  ADMIN_COOKIE,
  createAdminSessionToken,
  getAdminPassword,
} from "./admin-auth";
import {
  createRecordId,
  getCommerceDatabase,
  getRuntimeSecret,
  type CommerceDatabase,
} from "./commerce-server";
import { products } from "./catalog";
import { getSellerForProduct } from "./marketplace";

export type AppRole = "customer" | "seller" | "admin";

export type AppUser = {
  id: string;
  email: string;
  displayName: string;
  phone: string;
  role: AppRole;
  status: "active" | "suspended";
  sellerId: string | null;
};

export class PlatformError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function configuredAdminEmails() {
  return new Set(
    (await getRuntimeSecret("ADMIN_EMAILS"))
      .split(",")
      .map(normalizeEmail)
      .filter(Boolean),
  );
}

export async function hasLegacyAdminSession() {
  if (!(await getAdminPassword())) return false;
  const expected = await createAdminSessionToken();
  const current = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  return Boolean(expected && current === expected);
}

export async function getCurrentAppUser(): Promise<AppUser | null> {
  const identity = await getChatGPTUser();
  if (!identity) return null;
  const database = await getCommerceDatabase();
  if (!database) {
    const isAdmin = (await configuredAdminEmails()).has(
      normalizeEmail(identity.email),
    );
    return {
      id: `identity:${normalizeEmail(identity.email)}`,
      email: normalizeEmail(identity.email),
      displayName: identity.displayName,
      phone: "",
      role: isAdmin ? "admin" : "customer",
      status: "active",
      sellerId: null,
    };
  }

  const email = normalizeEmail(identity.email);
  const now = new Date().toISOString();
  const adminEmails = await configuredAdminEmails();
  const existing = await database
    .prepare(
      `SELECT id, email, display_name, phone, role, status, seller_id
       FROM app_users WHERE email = ? LIMIT 1`,
    )
    .bind(email)
    .first<{
      id: string;
      email: string;
      display_name: string;
      phone: string | null;
      role: AppRole;
      status: "active" | "suspended";
      seller_id: string | null;
    }>();

  if (!existing) {
    const id = createRecordId("user");
    const role: AppRole = adminEmails.has(email) ? "admin" : "customer";
    await database
      .prepare(
        `INSERT INTO app_users
         (id, email, display_name, phone, role, status, seller_id, created_at, updated_at)
         VALUES (?, ?, ?, NULL, ?, 'active', NULL, ?, ?)`,
      )
      .bind(id, email, identity.displayName.slice(0, 120), role, now, now)
      .run();
    return {
      id,
      email,
      displayName: identity.displayName,
      phone: "",
      role,
      status: "active",
      sellerId: null,
    };
  }

  const role: AppRole = adminEmails.has(email) ? "admin" : existing.role;
  if (role !== existing.role || existing.display_name !== identity.displayName) {
    await database
      .prepare(
        `UPDATE app_users
         SET display_name = ?, role = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(identity.displayName.slice(0, 120), role, now, existing.id)
      .run();
  }

  return {
    id: existing.id,
    email,
    displayName: identity.displayName,
    phone: existing.phone ?? "",
    role,
    status: existing.status,
    sellerId: existing.seller_id,
  };
}

export async function requireAppUser() {
  const user = await getCurrentAppUser();
  if (!user) {
    throw new PlatformError("Vui lòng đăng nhập để tiếp tục.", 401);
  }
  if (user.status !== "active") {
    throw new PlatformError("Tài khoản đang bị tạm khóa.", 403);
  }
  return user;
}

export async function requireRole(roles: AppRole[]) {
  const user = await getCurrentAppUser();
  if (user?.status === "active" && roles.includes(user.role)) return user;
  if (roles.includes("admin") && (await hasLegacyAdminSession())) {
    return {
      id: "legacy-admin",
      email: "legacy-admin@local",
      displayName: "Quản trị viên",
      phone: "",
      role: "admin" as const,
      status: "active" as const,
      sellerId: null,
    };
  }
  if (!user) throw new PlatformError("Vui lòng đăng nhập để tiếp tục.", 401);
  throw new PlatformError("Bạn không có quyền thực hiện thao tác này.", 403);
}

export async function requireDatabase() {
  const database = await getCommerceDatabase();
  if (!database) {
    throw new PlatformError("D1 chưa được cấu hình trên môi trường này.", 503);
  }
  return database;
}

export function errorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.";
  const status = error instanceof PlatformError ? error.status : 500;
  return Response.json({ message }, { status });
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  if (new URL(origin).origin !== new URL(request.url).origin) {
    throw new PlatformError("Nguồn yêu cầu không hợp lệ.", 403);
  }
}

export async function getRequestFingerprint() {
  const requestHeaders = await headers();
  const raw =
    requestHeaders.get("cf-connecting-ip") ??
    requestHeaders.get("x-forwarded-for") ??
    "unknown";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw.split(",")[0].trim()),
  );
  return Array.from(new Uint8Array(digest))
    .slice(0, 12)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function enforceRateLimit(
  database: CommerceDatabase,
  scope: string,
  limit: number,
  windowSeconds: number,
) {
  const fingerprint = await getRequestFingerprint();
  const key = `${scope}:${fingerprint}`;
  const now = Date.now();
  const row = await database
    .prepare(`SELECT count, reset_at FROM rate_limits WHERE key = ?`)
    .bind(key)
    .first<{ count: number; reset_at: string }>();

  if (!row || new Date(row.reset_at).getTime() <= now) {
    const resetAt = new Date(now + windowSeconds * 1000).toISOString();
    await database
      .prepare(
        `INSERT INTO rate_limits (key, count, reset_at)
         VALUES (?, 1, ?)
         ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at`,
      )
      .bind(key, resetAt)
      .run();
    return;
  }
  if (Number(row.count) >= limit) {
    throw new PlatformError(
      "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.",
      429,
    );
  }
  await database
    .prepare(`UPDATE rate_limits SET count = count + 1 WHERE key = ?`)
    .bind(key)
    .run();
}

export async function recordAudit(
  database: CommerceDatabase,
  {
    actorUserId,
    action,
    resourceType,
    resourceId,
    payload = {},
  }: {
    actorUserId?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    payload?: Record<string, unknown>;
  },
) {
  await database
    .prepare(
      `INSERT INTO audit_logs
       (id, actor_user_id, action, resource_type, resource_id, ip_hash, payload, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      createRecordId("audit"),
      actorUserId ?? null,
      action.slice(0, 80),
      resourceType.slice(0, 80),
      resourceId?.slice(0, 160) ?? null,
      await getRequestFingerprint(),
      JSON.stringify(payload).slice(0, 12000),
      new Date().toISOString(),
    )
    .run();
}

export function notificationStatement(
  database: CommerceDatabase,
  {
    userId,
    type,
    title,
    message,
    actionUrl,
  }: {
    userId: string;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
  },
) {
  return database
    .prepare(
      `INSERT INTO notifications
       (id, user_id, type, title, message, action_url, read_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`,
    )
    .bind(
      createRecordId("notice"),
      userId,
      type.slice(0, 40),
      title.slice(0, 120),
      message.slice(0, 500),
      actionUrl?.slice(0, 500) ?? null,
      new Date().toISOString(),
    );
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function ensureProductCatalog(database: CommerceDatabase) {
  const current = await database
    .prepare(`SELECT COUNT(*) AS count FROM platform_products`)
    .first<{ count: number }>();
  if (Number(current?.count ?? 0) >= products.length) return;
  const now = new Date().toISOString();
  const statements = products.flatMap((product, index) => {
    const seller = getSellerForProduct(product.id);
    return [
      database
        .prepare(
          `INSERT OR IGNORE INTO platform_products
           (id, seller_id, name, slug, category, price, old_price, rating,
            sold_count, delivery_days, image_url, badge, description, status,
            created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        )
        .bind(
          product.id,
          seller.id,
          product.name,
          `${slugify(product.name)}-${product.id}`,
          product.category,
          product.price,
          product.oldPrice,
          product.rating,
          Number(product.sold.replace(/[^\d]/g, "")) || 0,
          product.delivery,
          product.image,
          product.badge ?? null,
          product.description,
          now,
          now,
        ),
      database
        .prepare(
          `INSERT OR IGNORE INTO inventory
           (product_id, seller_id, available, reserved, sold, low_stock_threshold, updated_at)
           VALUES (?, ?, ?, 0, 0, 5, ?)`,
        )
        .bind(product.id, seller.id, index % 4 === 0 ? 8 : 42 + index * 7, now),
    ];
  });
  await database.batch(statements);
}

export type CatalogRow = {
  id: number;
  seller_id: string;
  name: string;
  category: string;
  price: number;
  old_price: number;
  rating: number;
  sold_count: number;
  delivery_days: number;
  image_url: string;
  badge: string | null;
  description: string;
  status: string;
  available: number;
  reserved: number;
  low_stock_threshold: number;
};

export async function listCatalog(database: CommerceDatabase) {
  await ensureProductCatalog(database);
  const rows = await database
    .prepare(
      `SELECT p.id, p.seller_id, p.name, p.category, p.price, p.old_price,
       p.rating, p.sold_count, p.delivery_days, p.image_url, p.badge,
       p.description, p.status, i.available, i.reserved, i.low_stock_threshold
       FROM platform_products p
       JOIN inventory i ON i.product_id = p.id
       ORDER BY p.id`,
    )
    .all<CatalogRow>();
  return rows.results ?? [];
}
