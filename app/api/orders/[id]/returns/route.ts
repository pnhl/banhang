import { createRecordId } from "../../../../lib/commerce-server";
import { getAccessibleOrder } from "../../../../lib/order-access-server";
import {
  assertSameOrigin,
  enforceRateLimit,
  errorResponse,
  notificationStatement,
  recordAudit,
  requireAppUser,
  requireDatabase,
  requireRole,
} from "../../../../lib/platform-server";

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
    const rows = await database
      .prepare(
        `SELECT id, order_id, reason, details, evidence_media_id, status,
         resolution, refund_amount, created_at, updated_at
         FROM return_requests WHERE order_id = ? ORDER BY created_at DESC`,
      )
      .bind(order.id)
      .all();
    return Response.json({ returns: rows.results ?? [] });
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
    const actor = await requireAppUser();
    const database = await requireDatabase();
    await enforceRateLimit(database, "return-request", 8, 60 * 60);
    const order = await getAccessibleOrder(
      database,
      actor,
      (await params).id,
    );
    if (
      !order ||
      order.customer_email.toLowerCase() !== actor.email.toLowerCase()
    ) {
      return Response.json(
        { message: "Không tìm thấy đơn hàng của bạn." },
        { status: 404 },
      );
    }
    if (
      ["Chờ thanh toán", "Chờ xác nhận", "Đã hủy"].includes(order.status)
    ) {
      return Response.json(
        { message: "Đơn chưa đủ điều kiện yêu cầu đổi trả." },
        { status: 409 },
      );
    }
    const body = (await request.json()) as {
      reason?: string;
      details?: string;
      evidenceMediaId?: string;
    };
    const reason = String(body.reason ?? "").trim().slice(0, 120);
    const details = String(body.details ?? "").trim().slice(0, 1500);
    if (!reason || details.length < 20) {
      return Response.json(
        { message: "Vui lòng mô tả vấn đề ít nhất 20 ký tự." },
        { status: 400 },
      );
    }
    const existing = await database
      .prepare(
        `SELECT id FROM return_requests
         WHERE order_id = ? AND status NOT IN ('rejected', 'closed') LIMIT 1`,
      )
      .bind(order.id)
      .first();
    if (existing) {
      return Response.json(
        { message: "Đơn đã có một yêu cầu đổi trả đang xử lý." },
        { status: 409 },
      );
    }
    const id = createRecordId("return");
    const now = new Date().toISOString();
    await database
      .prepare(
        `INSERT INTO return_requests
         (id, order_id, requester_user_id, seller_id, reason, details,
          evidence_media_id, status, resolution, refund_amount, created_at, updated_at)
         VALUES (?, ?, ?, NULL, ?, ?, ?, 'submitted', NULL, 0, ?, ?)`,
      )
      .bind(
        id,
        order.id,
        actor.id,
        reason,
        details,
        String(body.evidenceMediaId ?? "").slice(0, 160) || null,
        now,
        now,
      )
      .run();
    await recordAudit(database, {
      actorUserId: actor.id,
      action: "return.submitted",
      resourceType: "return_request",
      resourceId: id,
      payload: { orderId: order.id, reason },
    });
    return Response.json({ ok: true, id, status: "submitted" }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
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
      returnId?: string;
      status?:
        | "reviewing"
        | "approved"
        | "rejected"
        | "refunded"
        | "closed";
      resolution?: string;
      refundAmount?: number;
    };
    const statuses = [
      "reviewing",
      "approved",
      "rejected",
      "refunded",
      "closed",
    ];
    if (!body.returnId || !statuses.includes(body.status ?? "")) {
      return Response.json(
        { message: "Trạng thái đổi trả không hợp lệ." },
        { status: 400 },
      );
    }
    const refundAmount = Math.max(
      0,
      Math.trunc(Number(body.refundAmount ?? 0)),
    );
    const existing = await database
      .prepare(
        `SELECT requester_user_id FROM return_requests
         WHERE id = ? AND order_id = ? LIMIT 1`,
      )
      .bind(body.returnId, order.id)
      .first<{ requester_user_id: string }>();
    if (!existing) {
      return Response.json(
        { message: "Không tìm thấy yêu cầu đổi trả." },
        { status: 404 },
      );
    }
    const now = new Date().toISOString();
    await database.batch([
      database
        .prepare(
          `UPDATE return_requests
           SET status = ?, resolution = ?, refund_amount = ?, updated_at = ?
           WHERE id = ?`,
        )
        .bind(
          body.status,
          String(body.resolution ?? "").trim().slice(0, 1200) || null,
          refundAmount,
          now,
          body.returnId,
        ),
      notificationStatement(database, {
        userId: existing.requester_user_id,
        type: "return",
        title: `Yêu cầu đổi trả: ${body.status}`,
        message:
          String(body.resolution ?? "").trim() ||
          "LOPA MARKET vừa cập nhật yêu cầu của bạn.",
        actionUrl: `/orders/${order.id}`,
      }),
    ]);
    await recordAudit(database, {
      actorUserId: actor.id,
      action: `return.${body.status}`,
      resourceType: "return_request",
      resourceId: body.returnId,
      payload: { orderId: order.id, refundAmount },
    });
    return Response.json({ ok: true, status: body.status });
  } catch (error) {
    return errorResponse(error);
  }
}
