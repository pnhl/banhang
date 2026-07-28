"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { getOrders } from "../lib/account";
import { formatPrice } from "../lib/catalog";
import {
  BusinessProfile,
  getBusinessProfile,
  saveBusinessProfile,
} from "../lib/invoicing";
import {
  allocateOrderBySeller,
  Seller,
  sellers,
} from "../lib/marketplace";

type SellerMetric = {
  seller: Seller;
  orderCount: number;
  gross: number;
  commission: number;
  net: number;
  pending: number;
};

type CommerceReport = {
  configured: boolean;
  metrics: {
    order_count?: number;
    revenue?: number;
    tax?: number;
    discount?: number;
  } | null;
  funnel: Array<{ event_name: string; count: number; value: number }>;
  sellers: SellerMetric[];
  vouchers: Array<{ code: string; used_count: number; spent: number }>;
  settlements: Array<{
    id: string;
    seller_id: string;
    amount: number;
    order_count: number;
    created_at: string;
  }>;
};

function localSellerMetrics(): SellerMetric[] {
  const orders = getOrders().filter(
    (order) =>
      order.status !== "Đã hủy" && order.status !== "Chờ thanh toán",
  );
  return sellers.map((seller) => {
    const allocations = orders.flatMap((order) =>
      order.sellerAllocations ??
      allocateOrderBySeller(
        order.items,
        order.discount,
        order.taxAmount ?? 0,
      ),
    ).filter((allocation) => allocation.sellerId === seller.id);
    return {
      seller,
      orderCount: allocations.length,
      gross: allocations.reduce((sum, item) => sum + item.gross, 0),
      commission: allocations.reduce(
        (sum, item) => sum + item.commission,
        0,
      ),
      net: allocations.reduce((sum, item) => sum + item.net, 0),
      pending: allocations.reduce((sum, item) => sum + item.net, 0),
    };
  });
}

export function SellerCenter() {
  const [report, setReport] = useState<CommerceReport | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState(sellers[0].id);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessProfile>(
    getBusinessProfile(),
  );

  const loadReport = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/commerce", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Không tải được báo cáo.");
      const data = (await response.json()) as CommerceReport;
      setReport({
        ...data,
        sellers:
          data.sellers.length > 0 ? data.sellers : localSellerMetrics(),
      });
    } catch {
      setReport({
        configured: false,
        metrics: null,
        funnel: [],
        sellers: localSellerMetrics(),
        vouchers: [],
        settlements: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
  }, []);

  const selected =
    report?.sellers.find(
      (item) => item.seller.id === selectedSellerId,
    ) ??
    localSellerMetrics().find(
      (item) => item.seller.id === selectedSellerId,
    )!;
  const settlements = useMemo(
    () =>
      (report?.settlements ?? []).filter(
        (item) => item.seller_id === selectedSellerId,
      ),
    [report, selectedSellerId],
  );

  const settle = async () => {
    setNotice("");
    const response = await fetch("/api/admin/commerce", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "settle", sellerId: selectedSellerId }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    if (!response.ok) {
      setNotice(
        result.message ??
          "Chưa thể tạo kỳ đối soát. Hãy kiểm tra kho dữ liệu production.",
      );
      return;
    }
    setNotice("Đã tạo kỳ đối soát và ghi nhận thanh toán cho gian hàng.");
    await loadReport();
  };

  const saveBusiness = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveBusinessProfile(business);
    setNotice("Đã lưu thông tin doanh nghiệp dùng trên hóa đơn mới.");
  };

  return (
    <main className="seller-center">
      <header className="seller-center-topbar">
        <a className="brand" href="/">
          <span className="brand-mark">L</span>
          <span>
            LOPA<span>seller</span>
          </span>
        </a>
        <div>
          <a href="/seller/operations">Vận hành D1</a>
          <a href="/seller/media">Thư viện R2</a>
          <a href="/admin">Quản trị chung</a>
          <a href="/stores">Xem marketplace</a>
          <button
            onClick={async () => {
              await fetch("/api/admin/session", { method: "DELETE" });
              window.location.href =
                "/signout-with-chatgpt?return_to=%2F";
            }}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <section className="seller-center-shell">
        <aside className="seller-switcher">
          <p className="eyebrow">TÀI KHOẢN ĐỐI TÁC</p>
          <h1>Seller Center</h1>
          <p>Chọn gian hàng để xem doanh thu, phí nền tảng và số dư đối soát.</p>
          {sellers.map((seller) => (
            <button
              key={seller.id}
              className={seller.id === selectedSellerId ? "active" : ""}
              onClick={() => setSelectedSellerId(seller.id)}
            >
              <span style={{ background: seller.accent }}>
                {seller.shortName}
              </span>
              <b>
                {seller.name}
                <small>
                  Phí nền tảng {Math.round(seller.commissionRate * 1000) / 10}%
                </small>
              </b>
            </button>
          ))}
          <a href="/seller/operations">⚙ Tồn kho & vận chuyển</a>
          <a href="/seller/media">▧ Quản lý hình ảnh R2</a>
          <a href="/admin">← Trở lại LOPA Admin</a>
        </aside>

        <section className="seller-workspace">
          <header>
            <div>
              <p className="eyebrow">GIAN HÀNG ĐÃ XÁC MINH</p>
              <h2>{selected.seller.name}</h2>
              <p>{selected.seller.tagline}</p>
            </div>
            <span className={report?.configured ? "live" : "demo"}>
              {report?.configured
                ? "Dữ liệu D1 production"
                : "Dữ liệu dự phòng trên thiết bị"}
            </span>
          </header>

          <div className="seller-metrics">
            <article>
              <span>Doanh số</span>
              <strong>{formatPrice(selected.gross)}</strong>
              <small>{selected.orderCount} phân bổ đơn hàng</small>
            </article>
            <article>
              <span>Phí nền tảng</span>
              <strong>{formatPrice(selected.commission)}</strong>
              <small>
                {Math.round(selected.seller.commissionRate * 1000) / 10}% theo
                hợp đồng
              </small>
            </article>
            <article>
              <span>Doanh thu thuần</span>
              <strong>{formatPrice(selected.net)}</strong>
              <small>Sau giảm giá và phí nền tảng</small>
            </article>
            <article className="seller-wallet">
              <span>Số dư chờ đối soát</span>
              <strong>{formatPrice(selected.pending)}</strong>
              <button
                disabled={loading || selected.pending <= 0}
                onClick={settle}
              >
                Tạo kỳ đối soát
              </button>
            </article>
          </div>

          <div className="seller-center-grid">
            <section className="settlement-panel">
              <div>
                <p className="eyebrow">LỊCH SỬ CHI TRẢ</p>
                <h3>Đối soát gần đây</h3>
              </div>
              {settlements.map((item) => (
                <article key={item.id}>
                  <span>✓</span>
                  <p>
                    <b>{formatPrice(Number(item.amount))}</b>
                    <small>
                      {item.order_count} đơn ·{" "}
                      {new Intl.DateTimeFormat("vi-VN").format(
                        new Date(item.created_at),
                      )}
                    </small>
                  </p>
                  <em>Đã thanh toán</em>
                </article>
              ))}
              {settlements.length === 0 && (
                <p className="seller-empty">
                  Chưa có kỳ đối soát. Khi có đơn production, số dư sẽ xuất hiện
                  tại đây.
                </p>
              )}
            </section>

            <form className="business-profile-form" onSubmit={saveBusiness}>
              <div>
                <p className="eyebrow">HÓA ĐƠN & THUẾ</p>
                <h3>Thông tin doanh nghiệp</h3>
              </div>
              <label>
                Tên đơn vị
                <input
                  required
                  value={business.name}
                  onChange={(event) =>
                    setBusiness((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="two-col">
                <label>
                  Mã số thuế
                  <input
                    required
                    value={business.taxCode}
                    onChange={(event) =>
                      setBusiness((current) => ({
                        ...current,
                        taxCode: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Thuế suất VAT
                  <select
                    value={business.vatRate}
                    onChange={(event) =>
                      setBusiness((current) => ({
                        ...current,
                        vatRate: Number(event.target.value),
                      }))
                    }
                  >
                    <option value={0}>0%</option>
                    <option value={0.05}>5%</option>
                    <option value={0.08}>8%</option>
                    <option value={0.1}>10%</option>
                  </select>
                </label>
              </div>
              <label>
                Địa chỉ
                <input
                  required
                  value={business.address}
                  onChange={(event) =>
                    setBusiness((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Email nhận hóa đơn
                <input
                  required
                  type="email"
                  value={business.email}
                  onChange={(event) =>
                    setBusiness((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </label>
              <button>Lưu thông tin hóa đơn</button>
              <small>
                Bản demo tạo bản thể hiện hóa đơn. Phát hành hợp pháp cần kết
                nối nhà cung cấp hóa đơn điện tử và mã của cơ quan thuế.
              </small>
            </form>
          </div>
        </section>
      </section>
      {notice && <div className="toast"><span>✓</span>{notice}</div>}
    </main>
  );
}
