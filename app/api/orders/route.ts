import {
  errorResponse,
  requireAppUser,
  requireDatabase,
} from "../../lib/platform-server";
import { parseOrderPayload } from "../../lib/order-access-server";

export async function GET() {
  try {
    const user = await requireAppUser();
    const database = await requireDatabase();
    const rows =
      user.role === "admin"
        ? await database
            .prepare(
              `SELECT id, customer_email, status, payload, created_at
               FROM commerce_orders ORDER BY created_at DESC LIMIT 200`,
            )
            .all()
        : user.role === "seller" && user.sellerId
          ? await database
              .prepare(
                `SELECT DISTINCT o.id, o.customer_email, o.status, o.payload,
                 o.created_at FROM commerce_orders o
                 JOIN order_items i ON i.order_id = o.id
                 WHERE i.seller_id = ?
                 ORDER BY o.created_at DESC LIMIT 200`,
              )
              .bind(user.sellerId)
              .all()
          : await database
              .prepare(
                `SELECT id, customer_email, status, payload, created_at
                 FROM commerce_orders WHERE customer_email = ?
                 ORDER BY created_at DESC LIMIT 100`,
              )
              .bind(user.email)
              .all();
    return Response.json({
      orders: (rows.results ?? []).map((row) =>
        parseOrderPayload(
          row as {
            id: string;
            customer_email: string;
            status: string;
            payload: string;
            created_at: string;
          },
        ),
      ),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
