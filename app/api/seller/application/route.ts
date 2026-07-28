import {
  assertSameOrigin,
  enforceRateLimit,
  errorResponse,
  notificationStatement,
  recordAudit,
  requireAppUser,
  requireDatabase,
  requireRole,
} from "../../../lib/platform-server";
import { createRecordId } from "../../../lib/commerce-server";

export async function GET(request: Request) {
  try {
    const user = await requireAppUser();
    const database = await requireDatabase();
    const all =
      new URL(request.url).searchParams.get("all") === "1" &&
      user.role === "admin";
    const rows = all
      ? await database
          .prepare(
            `SELECT id, user_id, email, shop_name, business_type, tax_code,
             phone, description, status, reviewer_note, created_at, updated_at
             FROM seller_applications ORDER BY created_at DESC`,
          )
          .all()
      : await database
          .prepare(
            `SELECT id, user_id, email, shop_name, business_type, tax_code,
             phone, description, status, reviewer_note, created_at, updated_at
             FROM seller_applications WHERE user_id = ? LIMIT 1`,
          )
          .bind(user.id)
          .all();
    return Response.json({ applications: rows.results ?? [] });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireAppUser();
    const database = await requireDatabase();
    await enforceRateLimit(database, "seller-application", 5, 60 * 60);
    const body = (await request.json()) as {
      shopName?: string;
      businessType?: string;
      taxCode?: string;
      phone?: string;
      description?: string;
    };
    const shopName = String(body.shopName ?? "").trim().slice(0, 120);
    const businessType = String(body.businessType ?? "").trim().slice(0, 80);
    const phone = String(body.phone ?? "").trim().slice(0, 30);
    const description = String(body.description ?? "").trim().slice(0, 1200);
    if (!shopName || !businessType || !phone || description.length < 30) {
      return Response.json(
        { message: "Vui lòng điền đầy đủ hồ sơ và mô tả ít nhất 30 ký tự." },
        { status: 400 },
      );
    }
    const existing = await database
      .prepare(`SELECT id FROM seller_applications WHERE user_id = ?`)
      .bind(user.id)
      .first<{ id: string }>();
    const id = existing?.id ?? createRecordId("seller-application");
    const now = new Date().toISOString();
    await database
      .prepare(
        `INSERT INTO seller_applications
         (id, user_id, email, shop_name, business_type, tax_code, phone,
          description, status, reviewer_note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', NULL, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           shop_name = excluded.shop_name,
           business_type = excluded.business_type,
           tax_code = excluded.tax_code,
           phone = excluded.phone,
           description = excluded.description,
           status = 'submitted',
           reviewer_note = NULL,
           updated_at = excluded.updated_at`,
      )
      .bind(
        id,
        user.id,
        user.email,
        shopName,
        businessType,
        String(body.taxCode ?? "").trim().slice(0, 40) || null,
        phone,
        description,
        now,
        now,
      )
      .run();
    await recordAudit(database, {
      actorUserId: user.id,
      action: "seller.application.submitted",
      resourceType: "seller_application",
      resourceId: id,
    });
    return Response.json({ ok: true, id, status: "submitted" });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireRole(["admin"]);
    const database = await requireDatabase();
    const body = (await request.json()) as {
      id?: string;
      status?: "approved" | "rejected";
      reviewerNote?: string;
      sellerId?: string;
    };
    if (!body.id || !["approved", "rejected"].includes(body.status ?? "")) {
      return Response.json(
        { message: "Yêu cầu duyệt hồ sơ không hợp lệ." },
        { status: 400 },
      );
    }
    const application = await database
      .prepare(
        `SELECT user_id, shop_name FROM seller_applications WHERE id = ?`,
      )
      .bind(body.id.slice(0, 160))
      .first<{ user_id: string; shop_name: string }>();
    if (!application) {
      return Response.json(
        { message: "Không tìm thấy hồ sơ." },
        { status: 404 },
      );
    }
    const now = new Date().toISOString();
    const sellerId =
      body.status === "approved"
        ? String(body.sellerId ?? `seller-${application.user_id.slice(-8)}`)
            .trim()
            .slice(0, 100)
        : null;
    const statements = [
      database
        .prepare(
          `UPDATE seller_applications
           SET status = ?, reviewer_note = ?, updated_at = ? WHERE id = ?`,
        )
        .bind(
          body.status,
          String(body.reviewerNote ?? "").trim().slice(0, 500) || null,
          now,
          body.id,
        ),
      notificationStatement(database, {
        userId: application.user_id,
        type: "seller",
        title:
          body.status === "approved"
            ? "Gian hàng đã được phê duyệt"
            : "Hồ sơ người bán cần cập nhật",
        message:
          body.status === "approved"
            ? `${application.shop_name} đã có quyền truy cập Seller Center.`
            : String(body.reviewerNote ?? "Vui lòng cập nhật hồ sơ và gửi lại."),
        actionUrl: "/seller",
      }),
    ];
    if (body.status === "approved") {
      statements.push(
        database
          .prepare(
            `UPDATE app_users
             SET role = 'seller', seller_id = ?, updated_at = ? WHERE id = ?`,
          )
          .bind(sellerId, now, application.user_id),
      );
    }
    await database.batch(statements);
    await recordAudit(database, {
      actorUserId: actor.id,
      action: `seller.application.${body.status}`,
      resourceType: "seller_application",
      resourceId: body.id,
      payload: { sellerId },
    });
    return Response.json({ ok: true, status: body.status, sellerId });
  } catch (error) {
    return errorResponse(error);
  }
}
