import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  createAdminSessionToken,
  getAdminPassword,
} from "../../../lib/admin-auth";
import {
  createRecordId,
  getCommerceDatabase,
} from "../../../lib/commerce-server";
import { sellers } from "../../../lib/marketplace";

async function authorized() {
  if (!(await getAdminPassword())) return false;
  const expected = await createAdminSessionToken();
  const current = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  return Boolean(expected && current === expected);
}

export async function GET() {
  if (!(await authorized())) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }
  const database = await getCommerceDatabase();
  if (!database) {
    return NextResponse.json({
      configured: false,
      metrics: null,
      funnel: [],
      sellers: [],
      vouchers: [],
      settlements: [],
    });
  }

  const [metrics, funnel, sellerRows, vouchers, settlements] =
    await Promise.all([
      database
        .prepare(
          `SELECT COUNT(*) AS order_count,
          COALESCE(SUM(total), 0) AS revenue,
          COALESCE(SUM(tax), 0) AS tax,
          COALESCE(SUM(discount), 0) AS discount
          FROM commerce_orders WHERE status != 'Đã hủy'`,
        )
        .first(),
      database
        .prepare(
          `SELECT event_name, COUNT(*) AS count,
          COALESCE(SUM(value), 0) AS value
          FROM analytics_events
          GROUP BY event_name`,
        )
        .all(),
      database
        .prepare(
          `SELECT seller_id, COUNT(DISTINCT order_id) AS order_count,
          COALESCE(SUM(gross), 0) AS gross,
          COALESCE(SUM(commission), 0) AS commission,
          COALESCE(SUM(net), 0) AS net,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN net ELSE 0 END), 0) AS pending
          FROM seller_ledger GROUP BY seller_id`,
        )
        .all(),
      database
        .prepare(
          `SELECT code, COUNT(*) AS used_count, COALESCE(SUM(amount), 0) AS spent
          FROM voucher_redemptions GROUP BY code`,
        )
        .all(),
      database
        .prepare(
          `SELECT id, seller_id, amount, order_count, status, period_start, period_end, created_at
          FROM seller_settlements ORDER BY created_at DESC LIMIT 50`,
        )
        .all(),
    ]);

  const sellerMetrics = sellers.map((seller) => {
    const row = (sellerRows.results ?? []).find(
      (item) => String(item.seller_id) === seller.id,
    );
    return {
      seller,
      orderCount: Number(row?.order_count ?? 0),
      gross: Number(row?.gross ?? 0),
      commission: Number(row?.commission ?? 0),
      net: Number(row?.net ?? 0),
      pending: Number(row?.pending ?? 0),
    };
  });

  return NextResponse.json({
    configured: true,
    metrics,
    funnel: funnel.results ?? [],
    sellers: sellerMetrics,
    vouchers: vouchers.results ?? [],
    settlements: settlements.results ?? [],
  });
}

export async function POST(request: Request) {
  if (!(await authorized())) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    sellerId?: string;
  } | null;
  const seller = sellers.find((item) => item.id === body?.sellerId);
  if (body?.action !== "settle" || !seller) {
    return NextResponse.json(
      { message: "Yêu cầu đối soát không hợp lệ." },
      { status: 400 },
    );
  }
  const database = await getCommerceDatabase();
  if (!database) {
    return NextResponse.json(
      { message: "Kho dữ liệu đối soát chưa được cấu hình." },
      { status: 503 },
    );
  }

  const summary = await database
    .prepare(
      `SELECT COUNT(*) AS order_count, COALESCE(SUM(net), 0) AS amount,
      MIN(created_at) AS period_start, MAX(created_at) AS period_end
      FROM seller_ledger WHERE seller_id = ? AND status = 'pending'`,
    )
    .bind(seller.id)
    .first<{
      order_count?: number;
      amount?: number;
      period_start?: string;
      period_end?: string;
    }>();
  const amount = Number(summary?.amount ?? 0);
  if (amount <= 0) {
    return NextResponse.json(
      { message: "Gian hàng chưa có số dư chờ đối soát." },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const id = createRecordId("settlement");
  await database.batch([
    database
      .prepare(
        `INSERT INTO seller_settlements
        (id, seller_id, amount, order_count, status, period_start, period_end, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        seller.id,
        Math.round(amount),
        Number(summary?.order_count ?? 0),
        "paid",
        summary?.period_start ?? now,
        summary?.period_end ?? now,
        now,
      ),
    database
      .prepare(
        `UPDATE seller_ledger SET status = 'settled'
        WHERE seller_id = ? AND status = 'pending'`,
      )
      .bind(seller.id),
  ]);

  return NextResponse.json({
    ok: true,
    settlement: { id, sellerId: seller.id, amount, createdAt: now },
  });
}
