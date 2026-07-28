import { createRecordId } from "../../../../lib/commerce-server";
import { getAccessibleOrder } from "../../../../lib/order-access-server";
import {
  assertSameOrigin,
  errorResponse,
  notificationStatement,
  recordAudit,
  requireAppUser,
  requireDatabase,
  requireRole,
} from "../../../../lib/platform-server";

const ALLOWED_STATUSES = [
  "Chờ xác nhận",
  "Đang đóng gói",
  "Đã bàn giao vận chuyển",
  "Đang giao",
  "Giao lại",
  "Hoàn tất",
  "Đã hủy",
];

const orderStatusForShipment = (status: string) => {
  if (status === "Đang đóng gói" || status === "Đã bàn giao vận chuyển") {
    return "Đang đóng gói";
  }
  if (status === "Đang giao" || status === "Giao lại") return "Đang giao";
  if (status === "Hoàn tất") return "Hoàn tất";
  if (status === "Đã hủy") return "Đã hủy";
  return "Chờ xác nhận";
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAppUser();
    const database = await requireDatabase();
    const order = await getAccessibleOrder(
      database,
      actor,
      (await params).id,
    );
    if (!order) {
      return Response.json(
        { message: "Không tìm thấy đơn hàng." },
        { status: 404 },
      );
    }
    const shipment = await database
      .prepare(
        `SELECT id, order_id, carrier, tracking_code, status,
         estimated_delivery, shipping_address, created_at, updated_at
         FROM shipments WHERE order_id = ? LIMIT 1`,
      )
      .bind(order.id)
      .first<{ id: string } & Record<string, unknown>>();
    if (!shipment) return Response.json({ shipment: null, events: [] });
    const events = await database
      .prepare(
        `SELECT id, status, location, note, created_at
         FROM shipping_events WHERE shipment_id = ?
         ORDER BY created_at DESC`,
      )
      .bind(shipment.id)
      .all();
    return Response.json({ shipment, events: events.results ?? [] });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireRole(["seller", "admin"]);
    const database = await requireDatabase();
    const order = await getAccessibleOrder(
      database,
      actor,
      (await params).id,
    );
    if (!order) {
      return Response.json(
        { message: "Không tìm thấy đơn hàng hoặc không có quyền." },
        { status: 404 },
      );
    }
    const body = (await request.json()) as {
      status?: string;
      location?: string;
      note?: string;
      carrier?: string;
      trackingCode?: string;
    };
    const status = String(body.status ?? "");
    const note = String(body.note ?? "").trim().slice(0, 400);
    if (!ALLOWED_STATUSES.includes(status) || !note) {
      return Response.json(
        { message: "Trạng thái hoặc ghi chú vận chuyển không hợp lệ." },
        { status: 400 },
      );
    }
    const shipment = await database
      .prepare(`SELECT id FROM shipments WHERE order_id = ? LIMIT 1`)
      .bind(order.id)
      .first<{ id: string }>();
    if (!shipment) {
      return Response.json(
        { message: "Đơn chưa có mã vận chuyển." },
        { status: 409 },
      );
    }
    const now = new Date().toISOString();
    const nextOrderStatus = orderStatusForShipment(status);
    const user = await database
      .prepare(`SELECT id FROM app_users WHERE email = ? LIMIT 1`)
      .bind(order.customer_email)
      .first<{ id: string }>();
    const statements = [
      database
        .prepare(
          `UPDATE shipments SET status = ?,
           carrier = COALESCE(NULLIF(?, ''), carrier),
           tracking_code = COALESCE(NULLIF(?, ''), tracking_code),
           updated_at = ? WHERE id = ?`,
        )
        .bind(
          status,
          String(body.carrier ?? "").trim().slice(0, 80),
          String(body.trackingCode ?? "").trim().slice(0, 100),
          now,
          shipment.id,
        ),
      database
        .prepare(
          `INSERT INTO shipping_events
           (id, shipment_id, status, location, note, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          createRecordId("shipping-event"),
          shipment.id,
          status,
          String(body.location ?? "").trim().slice(0, 160) || null,
          note,
          actor.id,
          now,
        ),
      database
        .prepare(`UPDATE commerce_orders SET status = ? WHERE id = ?`)
        .bind(nextOrderStatus, order.id),
    ];
    if (user) {
      statements.push(
        notificationStatement(database, {
          userId: user.id,
          type: "shipping",
          title: `Đơn #${order.id}: ${status}`,
          message: note,
          actionUrl: `/orders/${order.id}`,
        }),
      );
    }
    await database.batch(statements);
    await recordAudit(database, {
      actorUserId: actor.id,
      action: "shipment.status.updated",
      resourceType: "shipment",
      resourceId: shipment.id,
      payload: { status, location: body.location },
    });
    return Response.json({ ok: true, status, orderStatus: nextOrderStatus });
  } catch (error) {
    return errorResponse(error);
  }
}
