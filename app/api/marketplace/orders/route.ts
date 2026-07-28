import { NextResponse } from "next/server";
import type { NovaOrder } from "../../../lib/account";

function isOrder(value: unknown): value is NovaOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<NovaOrder>;
  return (
    typeof order.id === "string" &&
    order.id.length <= 80 &&
    typeof order.total === "number" &&
    order.total >= 0 &&
    Array.isArray(order.items) &&
    order.items.length > 0 &&
    order.items.length <= 100 &&
    typeof order.customer?.email === "string"
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    order?: unknown;
  } | null;
  if (!body || !isOrder(body.order)) {
    return NextResponse.json(
      { message: "Đơn hàng không hợp lệ." },
      { status: 400 },
    );
  }

  if (body.order.payment === "payOS · VietQR") {
    return NextResponse.json(
      {
        message:
          "Đơn payOS chỉ được tạo qua API thanh toán bảo mật của máy chủ.",
      },
      { status: 409 },
    );
  }

  // Other payment methods remain explicitly device-local simulations. Keeping
  // them out of D1 prevents unverified client totals from polluting production.
  return NextResponse.json({
    accepted: true,
    persisted: false,
    reason: "simulated-payment-method",
  });
}
