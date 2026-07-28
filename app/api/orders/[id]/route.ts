import {
  errorResponse,
  requireAppUser,
  requireDatabase,
} from "../../../lib/platform-server";
import {
  getAccessibleOrder,
  parseOrderPayload,
} from "../../../lib/order-access-server";

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
    const payment = await database
      .prepare(
        `SELECT order_code, status, checkout_url, expires_at
         FROM payment_intents WHERE order_id = ? LIMIT 1`,
      )
      .bind(order.id)
      .first();
    return Response.json({
      order: parseOrderPayload(order),
      payment,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
