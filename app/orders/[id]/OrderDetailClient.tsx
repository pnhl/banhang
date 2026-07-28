"use client";

import { type FormEvent, useEffect, useState } from "react";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import {
  cancelOrder,
  getOrder,
  NovaOrder,
  OrderStatus,
} from "../../lib/account";
import {
  addProductToCart,
  formatPrice,
  getAdminStocks,
  getManagedProducts,
  saveAdminStocks,
} from "../../lib/catalog";
import { getSellerForProduct } from "../../lib/marketplace";

const progress: OrderStatus[] = [
  "Chờ thanh toán",
  "Chờ xác nhận",
  "Đang đóng gói",
  "Đang giao",
  "Hoàn tất",
];

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<NovaOrder | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState("");
  const [shipment, setShipment] = useState<{
    carrier?: string;
    tracking_code?: string;
    status?: string;
    estimated_delivery?: string;
  } | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<
    Array<{
      id: string;
      status: string;
      location: string | null;
      note: string;
      created_at: string;
    }>
  >([]);
  const [returns, setReturns] = useState<
    Array<{
      id: string;
      reason: string;
      details: string;
      status: string;
      resolution: string | null;
      refund_amount: number;
      created_at: string;
    }>
  >([]);
  const [showReturnForm, setShowReturnForm] = useState(false);

  useEffect(() => {
    const localOrder = getOrder(orderId);
    setOrder(localOrder);
    void Promise.all([
      fetch(`/api/orders/${orderId}`, { cache: "no-store" }),
      fetch(`/api/orders/${orderId}/tracking`, { cache: "no-store" }),
      fetch(`/api/orders/${orderId}/returns`, { cache: "no-store" }),
    ])
      .then(async ([orderResponse, trackingResponse, returnResponse]) => {
        if (orderResponse.ok) {
          const result = (await orderResponse.json()) as {
            order?: NovaOrder;
          };
          if (result.order) setOrder(result.order);
        }
        if (trackingResponse.ok) {
          const result = (await trackingResponse.json()) as {
            shipment?: typeof shipment;
            events?: typeof trackingEvents;
          };
          setShipment(result.shipment ?? null);
          setTrackingEvents(result.events ?? []);
        }
        if (returnResponse.ok) {
          const result = (await returnResponse.json()) as {
            returns?: typeof returns;
          };
          setReturns(result.returns ?? []);
        }
      })
      .finally(() => setLoaded(true));
  }, [orderId]);

  const cancel = async () => {
    if (order?.paymentOrderCode) {
      const response = await fetch(
        `/api/payments/payos/${order.paymentOrderCode}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        setNotice(result.message ?? "Không thể hủy thanh toán.");
        return;
      }
    }
    const next = cancelOrder(orderId);
    if (!next && order) {
      setOrder({ ...order, status: "Đã hủy" });
      setNotice("Đơn hàng đã được hủy và tồn kho D1 đã được hoàn lại.");
      return;
    }
    if (order) {
      const nextStocks = { ...getAdminStocks(getManagedProducts()) };
      order.items.forEach((item) => {
        nextStocks[item.id] = (nextStocks[item.id] ?? 0) + item.quantity;
      });
      saveAdminStocks(nextStocks);
    }
    setOrder(next);
    setNotice("Đơn hàng đã được hủy và tồn kho đã được hoàn lại.");
  };

  const requestReturn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/orders/${orderId}/returns`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reason: form.get("reason"),
        details: form.get("details"),
      }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      message?: string;
      id?: string;
      status?: string;
    };
    if (!response.ok) {
      setNotice(result.message ?? "Chưa thể gửi yêu cầu đổi trả.");
      return;
    }
    setReturns((current) => [
      {
        id: result.id ?? `return-${Date.now()}`,
        reason: String(form.get("reason") ?? ""),
        details: String(form.get("details") ?? ""),
        status: result.status ?? "submitted",
        resolution: null,
        refund_amount: 0,
        created_at: new Date().toISOString(),
      },
      ...current,
    ]);
    setShowReturnForm(false);
    setNotice("Yêu cầu đổi trả đã được gửi và ghi nhận trong D1.");
  };

  const reorder = () => {
    if (!order) return;
    for (const item of order.items) {
      addProductToCart(
        item,
        item.quantity,
        item.variant ?? "Tiêu chuẩn",
      );
    }
    window.location.href = "/cart";
  };

  if (!loaded) {
    return (
      <>
        <SiteHeader />
        <main className="order-detail-loading wrap">Đang tải đơn hàng…</main>
        <SiteFooter />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <SiteHeader />
        <main className="order-not-found wrap">
          <span>◇</span>
          <p className="eyebrow">TRA CỨU ĐƠN HÀNG</p>
          <h1>Không tìm thấy đơn #{orderId}.</h1>
          <p>
            Đơn demo chỉ hiển thị trên đúng trình duyệt đã dùng để đặt hàng.
          </p>
          <div>
            <a href="/account">Xem lịch sử mua hàng</a>
            <a href="/support">Trung tâm trợ giúp</a>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const currentIndex = progress.indexOf(order.status);
  const shippingFee = order.shippingFee ?? 0;

  return (
    <>
      <SiteHeader />
      <div className="page-breadcrumb wrap">
        <a href="/">Trang chủ</a><span>›</span><a href="/account">Tài khoản</a><span>›</span><b>#{order.id}</b>
      </div>
      <main className="order-detail-page wrap">
        <div className="invoice-print-header">
          <div>
            <span className="brand-mark">L</span>
            <p><b>LOPA MARKET</b><small>HÓA ĐƠN BÁN HÀNG</small></p>
          </div>
          <p>Mã hóa đơn: #{order.id}</p>
        </div>
        <header>
          <div>
            <p className="eyebrow">CHI TIẾT ĐƠN HÀNG</p>
            <h1>Đơn #{order.id}</h1>
            <p>
              Đặt lúc{" "}
              {new Intl.DateTimeFormat("vi-VN", {
                dateStyle: "long",
                timeStyle: "short",
              }).format(new Date(order.createdAt))}
            </p>
          </div>
          <span className={`order-detail-status status-${order.status.replaceAll(" ", "-").toLowerCase()}`}>
            {order.status}
          </span>
        </header>

        {order.status === "Đã hủy" ? (
          <section className="cancelled-order-note">
            <span>×</span>
            <div><b>Đơn hàng đã hủy</b><p>Bạn có thể thêm lại toàn bộ sản phẩm vào giỏ để đặt đơn mới.</p></div>
          </section>
        ) : (
          <section className="order-progress" aria-label="Tiến trình đơn hàng">
            {progress.map((status, index) => (
              <div className={index <= currentIndex ? "complete" : ""} key={status}>
                <span>{index < currentIndex ? "✓" : index + 1}</span>
                <b>{status}</b>
                <small>
                  {
                    {
                      "Chờ thanh toán": "Đang chờ payOS xác nhận",
                      "Chờ xác nhận": "LOPA đã nhận thanh toán",
                      "Đang đóng gói": "Chuẩn bị sản phẩm",
                      "Đang giao": "Đang trên đường đến bạn",
                      "Hoàn tất": "Giao hàng thành công",
                      "Đã hủy": "Đơn đã kết thúc",
                    }[status]
                  }
                </small>
              </div>
            ))}
          </section>
        )}

        {shipment && (
          <section className="tracking-card">
            <header>
              <div>
                <p className="eyebrow">THEO DÕI VẬN CHUYỂN</p>
                <h2>{shipment.carrier ?? "LOPA Express"}</h2>
              </div>
              <div>
                <span>{shipment.status}</span>
                <b>{shipment.tracking_code}</b>
              </div>
            </header>
            <div className="tracking-timeline">
              {trackingEvents.map((event) => (
                <article key={event.id}>
                  <span />
                  <time>
                    {new Intl.DateTimeFormat("vi-VN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(event.created_at))}
                  </time>
                  <div>
                    <b>{event.status}</b>
                    <p>{event.note}</p>
                    {event.location && <small>{event.location}</small>}
                  </div>
                </article>
              ))}
              {trackingEvents.length === 0 && (
                <p>Trạng thái đầu tiên sẽ xuất hiện sau khi payOS xác nhận thanh toán.</p>
              )}
            </div>
          </section>
        )}

        <div className="order-detail-grid">
          <section className="order-detail-items">
            <div className="account-section-heading">
              <div><p className="eyebrow">SẢN PHẨM</p><h2>{order.items.reduce((sum, item) => sum + item.quantity, 0)} món trong đơn</h2></div>
            </div>
            {order.items.map((item) => (
              <article key={`${item.id}-${item.variant ?? "default"}`}>
                <a href={`/product/${item.id}`}><img src={item.image} alt={item.name} /></a>
                <div>
                  <p>{item.category}</p>
                  <a href={`/product/${item.id}`}>{item.name}</a>
                  <small>
                    {item.variant ?? "Tiêu chuẩn"} · Số lượng {item.quantity}
                    {" · "}
                    {getSellerForProduct(item.id).name}
                  </small>
                </div>
                <strong>{formatPrice(item.price * item.quantity)}</strong>
              </article>
            ))}
          </section>

          <aside className="order-detail-summary">
            <section>
              <p className="eyebrow">GIAO HÀNG</p>
              <h2>{order.shippingMethod ?? "Tiêu chuẩn"}</h2>
              <p><b>{order.customer.name}</b><br />{order.customer.phone}<br />{order.customer.address}</p>
              {order.shippingNote && <small>Ghi chú: {order.shippingNote}</small>}
            </section>
            <section>
              <p className="eyebrow">THANH TOÁN</p>
              <h2>{order.payment}</h2>
              <dl>
                <div><dt>Tạm tính</dt><dd>{formatPrice(order.subtotal)}</dd></div>
                <div><dt>Giảm giá</dt><dd>− {formatPrice(order.discount)}</dd></div>
                <div><dt>Vận chuyển</dt><dd>{shippingFee ? formatPrice(shippingFee) : "Miễn phí"}</dd></div>
                <div><dt>Tiền trước thuế</dt><dd>{formatPrice(order.amountBeforeTax ?? order.total)}</dd></div>
                <div><dt>Thuế GTGT</dt><dd>{formatPrice(order.taxAmount ?? 0)}</dd></div>
                <div><dt>Tổng cộng</dt><dd>{formatPrice(order.total)}</dd></div>
              </dl>
            </section>
            <div className="order-detail-actions">
              <button onClick={reorder}>Mua lại đơn hàng</button>
              <button className="invoice-button" onClick={() => window.print()}>
                In / lưu PDF hóa đơn
              </button>
              <a className="invoice-link-button" href={`/invoices/${order.id}`}>
                Xem hóa đơn điện tử
              </a>
              {order.status === "Chờ xác nhận" && (
                <button className="cancel-button" onClick={cancel}>Hủy đơn hàng</button>
              )}
              {order.status === "Chờ thanh toán" && (
                <button className="cancel-button" onClick={cancel}>Hủy thanh toán</button>
              )}
            </div>
          </aside>
        </div>
        <section className="returns-card">
          <header>
            <div>
              <p className="eyebrow">ĐỔI TRẢ & HOÀN TIỀN</p>
              <h2>Yêu cầu hỗ trợ sau bán</h2>
            </div>
            {!["Chờ thanh toán", "Chờ xác nhận", "Đã hủy"].includes(
              order.status,
            ) &&
              returns.length === 0 && (
                <button onClick={() => setShowReturnForm((value) => !value)}>
                  Tạo yêu cầu
                </button>
              )}
          </header>
          {showReturnForm && (
            <form onSubmit={requestReturn}>
              <label>
                Lý do
                <select name="reason" required>
                  <option>Sản phẩm lỗi hoặc hư hỏng</option>
                  <option>Giao sai sản phẩm</option>
                  <option>Thiếu phụ kiện</option>
                  <option>Không đúng mô tả</option>
                  <option>Lý do khác</option>
                </select>
              </label>
              <label>
                Mô tả chi tiết
                <textarea name="details" required minLength={20} />
              </label>
              <button>Gửi yêu cầu đổi trả</button>
            </form>
          )}
          {returns.map((item) => (
            <article key={item.id}>
              <span>{item.status}</span>
              <div>
                <b>{item.reason}</b>
                <p>{item.details}</p>
                {item.resolution && <small>Phản hồi: {item.resolution}</small>}
              </div>
              {item.refund_amount > 0 && (
                <strong>{formatPrice(item.refund_amount)}</strong>
              )}
            </article>
          ))}
          {!returns.length && !showReturnForm && (
            <p className="returns-empty">
              Chưa có yêu cầu. LOPA hỗ trợ tiếp nhận đổi trả ngay trên đơn hàng.
            </p>
          )}
        </section>
      </main>
      {notice && <div className="toast"><span>✓</span>{notice}</div>}
      <SiteFooter />
    </>
  );
}
