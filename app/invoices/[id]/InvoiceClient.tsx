"use client";

import { useEffect, useState } from "react";
import { getOrder, NovaOrder } from "../../lib/account";
import { formatPrice } from "../../lib/catalog";
import {
  defaultBusinessProfile,
  getBusinessProfile,
} from "../../lib/invoicing";
import { getSellerForProduct } from "../../lib/marketplace";

export function InvoiceClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<NovaOrder | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setOrder(getOrder(orderId));
    setLoaded(true);
  }, [orderId]);

  if (!loaded) {
    return <main className="invoice-loading">Đang chuẩn bị hóa đơn…</main>;
  }
  if (!order) {
    return (
      <main className="invoice-missing">
        <span>◇</span>
        <h1>Không tìm thấy hóa đơn.</h1>
        <p>Hóa đơn demo chỉ có trên thiết bị đã tạo đơn hàng.</p>
        <a href="/account">Quay lại tài khoản</a>
      </main>
    );
  }

  const business =
    order.business ?? getBusinessProfile() ?? defaultBusinessProfile;
  const download = () => {
    const payload = {
      specification: "LOPA_EINVOICE_DEMO_V1",
      legalStatus: "demo-not-tax-authority-issued",
      order,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${order.invoiceNumber ?? order.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="einvoice-page">
      <div className="einvoice-toolbar">
        <a href={`/orders/${order.id}`}>← Trở lại đơn hàng</a>
        <div>
          <button onClick={download}>Tải dữ liệu JSON</button>
          <button onClick={() => window.print()}>In / lưu PDF</button>
        </div>
      </div>
      <article className="einvoice-sheet">
        <header>
          <div className="einvoice-brand">
            <span className="brand-mark">L</span>
            <p>
              <b>{business.name}</b>
              <small>BẢN THỂ HIỆN HÓA ĐƠN ĐIỆN TỬ</small>
            </p>
          </div>
          <div>
            <span className="invoice-demo-stamp">DEMO · CHƯA PHÁT HÀNH THUẾ</span>
            <p>Ký hiệu: {business.invoiceSeries}</p>
            <p>Số: {order.invoiceNumber ?? order.id}</p>
          </div>
        </header>

        <section className="invoice-parties">
          <div>
            <p className="eyebrow">NGƯỜI BÁN</p>
            <h1>{business.name}</h1>
            <p>Mã số thuế: {business.taxCode}</p>
            <p>Địa chỉ: {business.address}</p>
            <p>Email: {business.email}</p>
          </div>
          <div>
            <p className="eyebrow">NGƯỜI MUA</p>
            <h2>{order.customer.name}</h2>
            <p>Email: {order.customer.email}</p>
            <p>Điện thoại: {order.customer.phone}</p>
            <p>Địa chỉ: {order.customer.address}</p>
          </div>
        </section>

        <section className="invoice-meta">
          <p>
            <span>Ngày lập</span>
            <b>
              {new Intl.DateTimeFormat("vi-VN", {
                dateStyle: "long",
                timeStyle: "short",
              }).format(new Date(order.createdAt))}
            </b>
          </p>
          <p><span>Đơn hàng</span><b>#{order.id}</b></p>
          <p><span>Thanh toán</span><b>{order.payment}</b></p>
          <p><span>Trạng thái</span><b>{order.invoiceStatus ?? "issued-demo"}</b></p>
        </section>

        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Hàng hóa, dịch vụ</th>
              <th>Gian hàng</th>
              <th>SL</th>
              <th>Đơn giá</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => {
              const seller = getSellerForProduct(item.id);
              return (
                <tr key={`${item.id}-${item.variant ?? "default"}`}>
                  <td>{index + 1}</td>
                  <td>
                    <b>{item.name}</b>
                    <small>{item.variant ?? "Tiêu chuẩn"}</small>
                  </td>
                  <td>{seller.name}</td>
                  <td>{item.quantity}</td>
                  <td>{formatPrice(item.price)}</td>
                  <td>{formatPrice(item.price * item.quantity)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <section className="invoice-bottom">
          <div>
            <p className="eyebrow">PHÂN BỔ MARKETPLACE</p>
            {(order.sellerAllocations ?? []).map((allocation) => (
              <p key={allocation.sellerId}>
                <span>{allocation.sellerName}</span>
                <b>{formatPrice(allocation.net)}</b>
              </p>
            ))}
            <small>
              Phân bổ này phục vụ đối soát giữa nền tảng và nhà bán hàng, không
              làm thay đổi số tiền người mua thanh toán.
            </small>
          </div>
          <dl>
            <div><dt>Tạm tính hàng hóa</dt><dd>{formatPrice(order.subtotal)}</dd></div>
            <div><dt>Giảm giá</dt><dd>− {formatPrice(order.discount)}</dd></div>
            <div><dt>Phí vận chuyển</dt><dd>{formatPrice(order.shippingFee ?? 0)}</dd></div>
            <div><dt>Tiền trước thuế</dt><dd>{formatPrice(order.amountBeforeTax ?? order.total)}</dd></div>
            <div><dt>Thuế GTGT</dt><dd>{formatPrice(order.taxAmount ?? 0)}</dd></div>
            <div className="invoice-grand-total"><dt>Tổng thanh toán</dt><dd>{formatPrice(order.total)}</dd></div>
          </dl>
        </section>

        <footer>
          <p>
            Đây là bản thể hiện hóa đơn điện tử ở chế độ demo, chưa có mã cơ
            quan thuế hoặc chữ ký số và không thay thế hóa đơn hợp pháp.
          </p>
          <span>Tra cứu nội bộ: LOPA/{order.id}</span>
        </footer>
      </article>
    </main>
  );
}
