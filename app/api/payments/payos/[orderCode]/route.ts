import {
  cancelPayOSPayment,
  getPayOSPayment,
} from "../../../../lib/payos-server";
import {
  cancelPendingOrder,
  finalizePaidOrder,
  getPaymentIntent,
  publicPaymentState,
} from "../../../../lib/order-server";
import {
  assertSameOrigin,
  errorResponse,
  requireAppUser,
  requireDatabase,
} from "../../../../lib/platform-server";

async function accessiblePayment(
  orderCode: number,
  email: string,
  role: string,
) {
  const database = await requireDatabase();
  const payment = await getPaymentIntent(database, orderCode);
  if (
    !payment ||
    (role !== "admin" && payment.user_email.toLowerCase() !== email.toLowerCase())
  ) {
    return { database, payment: null };
  }
  return { database, payment };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderCode: string }> },
) {
  try {
    const user = await requireAppUser();
    const orderCode = Number((await params).orderCode);
    if (!Number.isSafeInteger(orderCode)) {
      return Response.json(
        { message: "Mã thanh toán không hợp lệ." },
        { status: 400 },
      );
    }
    const { database, payment: accessible } = await accessiblePayment(
      orderCode,
      user.email,
      user.role,
    );
    let payment = accessible;
    if (!payment) {
      return Response.json(
        { message: "Không tìm thấy giao dịch." },
        { status: 404 },
      );
    }
    if (
      payment.status === "PENDING" &&
      payment.expires_at &&
      new Date(payment.expires_at).getTime() <= Date.now()
    ) {
      await cancelPendingOrder(
        database,
        orderCode,
        "Thời gian thanh toán 15 phút đã kết thúc.",
        "EXPIRED",
      );
    } else if (payment.status === "PENDING") {
      const remote = await getPayOSPayment(
        payment.payment_link_id ?? orderCode,
      );
      if (
        remote?.status === "PAID" &&
        Number(remote.amount) === Number(payment.amount)
      ) {
        await finalizePaidOrder(
          database,
          orderCode,
          String(
            (remote as unknown as { reference?: string }).reference ?? "",
          ),
        );
      } else if (remote?.status === "PAID") {
        return Response.json(
          { message: "Số tiền payOS không khớp với đơn hàng." },
          { status: 409 },
        );
      } else if (["CANCELLED", "EXPIRED"].includes(remote?.status ?? "")) {
        await cancelPendingOrder(
          database,
          orderCode,
          "Trạng thái payOS đã kết thúc.",
          remote?.status === "EXPIRED" ? "EXPIRED" : "CANCELLED",
        );
      }
    }
    payment = await getPaymentIntent(database, orderCode);
    return Response.json({
      payment: payment ? publicPaymentState(payment) : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orderCode: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireAppUser();
    const orderCode = Number((await params).orderCode);
    const { database, payment } = await accessiblePayment(
      orderCode,
      user.email,
      user.role,
    );
    if (!payment) {
      return Response.json(
        { message: "Không tìm thấy giao dịch." },
        { status: 404 },
      );
    }
    if (payment.status === "PAID") {
      return Response.json(
        { message: "Giao dịch đã thanh toán, không thể hủy trực tiếp." },
        { status: 409 },
      );
    }
    await cancelPayOSPayment(
      payment.payment_link_id ?? orderCode,
      "Khách hàng hủy tại LOPA MARKET",
    ).catch(() => null);
    const cancelled = await cancelPendingOrder(
      database,
      orderCode,
      "Khách hàng chủ động hủy thanh toán.",
      "CANCELLED",
    );
    return Response.json({
      ok: true,
      payment: cancelled ? publicPaymentState(cancelled) : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
