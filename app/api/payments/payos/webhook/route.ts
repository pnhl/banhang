import {
  finalizePaidOrder,
  getPaymentIntent,
} from "../../../../lib/order-server";
import { verifyPayOSWebhook } from "../../../../lib/payos-server";
import {
  errorResponse,
  requireDatabase,
} from "../../../../lib/platform-server";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      code?: string;
      success?: boolean;
      data?: Record<string, unknown>;
      signature?: string;
    };
    if (
      !payload.data ||
      !payload.signature ||
      !(await verifyPayOSWebhook(payload.data, payload.signature))
    ) {
      return Response.json(
        { message: "Chữ ký webhook không hợp lệ." },
        { status: 401 },
      );
    }
    const orderCode = Number(payload.data.orderCode);
    if (!Number.isSafeInteger(orderCode)) {
      return Response.json(
        { message: "Mã đơn payOS không hợp lệ." },
        { status: 400 },
      );
    }
    const database = await requireDatabase();
    const payment = await getPaymentIntent(database, orderCode);
    // payOS sends a signed sample while confirming a webhook URL.
    if (!payment) return Response.json({ success: true });
    if (
      payload.success &&
      payload.code === "00" &&
      String(payload.data.code ?? "") === "00"
    ) {
      if (Number(payload.data.amount) !== Number(payment.amount)) {
        return Response.json(
          { message: "Số tiền webhook không khớp với đơn hàng." },
          { status: 409 },
        );
      }
      await finalizePaidOrder(
        database,
        orderCode,
        String(payload.data.reference ?? ""),
      );
    }
    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
