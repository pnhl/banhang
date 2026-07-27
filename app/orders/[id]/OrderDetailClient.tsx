"use client";

import { useEffect, useState } from "react";
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
  "Chờ xác nhận",
  "Đang đóng gói",
  "Đang giao",
  "Hoàn tất",
];

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<NovaOrder | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setOrder(getOrder(orderId));
    setLoaded(true);
  }, [orderId]);

  const cancel = () => {
    const next = cancelOrder(orderId);
    if (!next) return;
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
                  {index === 0
                    ? "LOPA đã nhận đơn"
                    : index === 1
                      ? "Chuẩn bị sản phẩm"
                      : index === 2
                        ? "Đang trên đường đến bạn"
                        : "Giao hàng thành công"}
                </small>
              </div>
            ))}
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
            </div>
          </aside>
        </div>
      </main>
      {notice && <div className="toast"><span>✓</span>{notice}</div>}
      <SiteFooter />
    </>
  );
}
