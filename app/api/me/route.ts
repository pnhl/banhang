import {
  assertSameOrigin,
  errorResponse,
  getCurrentAppUser,
  recordAudit,
  requireAppUser,
  requireDatabase,
} from "../../lib/platform-server";

export async function GET() {
  try {
    const user = await getCurrentAppUser();
    if (!user) return Response.json({ authenticated: false });
    const database = await requireDatabase();
    const address = await database
      .prepare(
        `SELECT id, label, recipient_name, phone, province_code, province,
         ward_code, ward, address_detail, is_default
         FROM user_addresses WHERE user_id = ?
         ORDER BY is_default DESC, updated_at DESC LIMIT 1`,
      )
      .bind(user.id)
      .first();
    const unread = await database
      .prepare(
        `SELECT COUNT(*) AS count FROM notifications
         WHERE user_id = ? AND read_at IS NULL`,
      )
      .bind(user.id)
      .first<{ count: number }>();
    return Response.json({
      authenticated: true,
      user,
      address,
      unreadNotifications: Number(unread?.count ?? 0),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireAppUser();
    const database = await requireDatabase();
    const body = (await request.json()) as {
      phone?: string;
      address?: {
        recipientName?: string;
        phone?: string;
        provinceCode?: number;
        province?: string;
        wardCode?: number;
        ward?: string;
        addressDetail?: string;
      };
    };
    const phone = String(body.phone ?? "").trim().slice(0, 30);
    const now = new Date().toISOString();
    const statements = [
      database
        .prepare(
          `UPDATE app_users SET phone = ?, updated_at = ? WHERE id = ?`,
        )
        .bind(phone || null, now, user.id),
    ];
    if (body.address) {
      const address = body.address;
      const recipientName = String(
        address.recipientName ?? user.displayName,
      )
        .trim()
        .slice(0, 120);
      const addressPhone = String(address.phone ?? phone).trim().slice(0, 30);
      const province = String(address.province ?? "").trim().slice(0, 120);
      const ward = String(address.ward ?? "").trim().slice(0, 120);
      const detail = String(address.addressDetail ?? "").trim().slice(0, 300);
      if (!recipientName || !addressPhone || !province || !ward || !detail) {
        return Response.json(
          { message: "Thông tin địa chỉ chưa đầy đủ." },
          { status: 400 },
        );
      }
      statements.push(
        database
          .prepare(
            `INSERT INTO user_addresses
             (id, user_id, label, recipient_name, phone, province_code, province,
              ward_code, ward, address_detail, is_default, created_at, updated_at)
             VALUES (?, ?, 'Mặc định', ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               recipient_name = excluded.recipient_name,
               phone = excluded.phone,
               province_code = excluded.province_code,
               province = excluded.province,
               ward_code = excluded.ward_code,
               ward = excluded.ward,
               address_detail = excluded.address_detail,
               is_default = 1,
               updated_at = excluded.updated_at`,
          )
          .bind(
            `address:${user.id}`,
            user.id,
            recipientName,
            addressPhone,
            Number.isFinite(Number(address.provinceCode))
              ? Number(address.provinceCode)
              : null,
            province,
            Number.isFinite(Number(address.wardCode))
              ? Number(address.wardCode)
              : null,
            ward,
            detail,
            now,
            now,
          ),
      );
    }
    await database.batch(statements);
    await recordAudit(database, {
      actorUserId: user.id,
      action: "account.profile.updated",
      resourceType: "user",
      resourceId: user.id,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
