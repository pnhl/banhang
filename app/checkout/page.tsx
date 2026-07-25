"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import {
  AccountProfile,
  createOrder,
  getProfile,
  saveProfile,
} from "../lib/account";
import {
  CartLine,
  cartLineKey,
  formatPrice,
  getAdminStocks,
  getCart,
  getManagedProducts,
  getVoucherByCode,
  PRODUCTS_UPDATED_EVENT,
  saveAdminStocks,
  saveCart,
  VOUCHERS_UPDATED_EVENT,
} from "../lib/catalog";

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [discount, setDiscount] = useState(0);
  const [voucherCode, setVoucherCode] = useState("");
  const [stocks, setStocks] = useState<Record<number, number>>({});
  const [checkoutError, setCheckoutError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [shipping, setShipping] = useState("Tiêu chuẩn");
  const [payment, setPayment] = useState("Ví điện tử");

  useEffect(() => {
    setCart(getCart());
    setProfile(getProfile());
    setVoucherCode(window.sessionStorage.getItem("nova-voucher") ?? "");
    const syncStocks = () =>
      setStocks(getAdminStocks(getManagedProducts()));
    syncStocks();
    window.addEventListener(PRODUCTS_UPDATED_EVENT, syncStocks);
    return () =>
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, syncStocks);
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );
  const appliedDiscount = Math.min(discount, subtotal);
  const hasStockIssue = cart.some(
    (item) => (stocks[item.id] ?? 0) < item.quantity,
  );
  const shippingFee =
    shipping === "Hỏa tốc" ? 69000 : shipping === "Nhanh" ? 39000 : 0;
  const shippingEta =
    shipping === "Hỏa tốc"
      ? "Trong ngày"
      : shipping === "Nhanh"
        ? "1–2 ngày"
        : "2–4 ngày";
  const total = Math.max(0, subtotal - appliedDiscount + shippingFee);

  useEffect(() => {
    const syncVoucher = () => {
      const selected = getVoucherByCode(voucherCode);
      setDiscount(
        selected && subtotal >= selected.minSubtotal
          ? Math.min(selected.discount, subtotal)
          : 0,
      );
    };
    syncVoucher();
    window.addEventListener(VOUCHERS_UPDATED_EVENT, syncVoucher);
    return () =>
      window.removeEventListener(VOUCHERS_UPDATED_EVENT, syncVoucher);
  }, [subtotal, voucherCode]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (hasStockIssue) {
      setCheckoutError(
        "Một hoặc nhiều sản phẩm không còn đủ tồn kho. Vui lòng quay lại giỏ hàng để điều chỉnh.",
      );
      return;
    }
    const form = new FormData(event.currentTarget);
    const customer = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      address: String(form.get("address") ?? ""),
    };
    saveProfile(customer);
    const order = createOrder({
      customer,
      items: cart,
      payment: String(form.get("payment") ?? "Ví điện tử"),
      shippingMethod: shipping,
      shippingFee,
      shippingNote: String(form.get("note") ?? ""),
      subtotal,
      discount: appliedDiscount,
      total,
    });
    const nextStocks = { ...stocks };
    cart.forEach((item) => {
      nextStocks[item.id] = Math.max(
        0,
        (nextStocks[item.id] ?? 0) - item.quantity,
      );
    });
    saveAdminStocks(nextStocks);
    setStocks(nextStocks);
    saveCart([]);
    window.sessionStorage.removeItem("nova-voucher");
    setCart([]);
    setOrderId(order.id);
  };

  if (orderId) {
    return (
      <>
        <SiteHeader />
        <main className="order-success">
          <span>✓</span>
          <p className="eyebrow">ĐẶT HÀNG THÀNH CÔNG</p>
          <h1>Cảm ơn bạn đã chọn NOVA.</h1>
          <p>
            Mã đơn <b>#{orderId}</b> đã được lưu vào lịch sử mua hàng trên thiết
            bị này.
          </p>
          <div>
            <a href="/">Tiếp tục mua sắm</a>
            <a href={`/orders/${orderId}`}>Theo dõi đơn hàng</a>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <div className="page-breadcrumb wrap">
        <a href="/">Trang chủ</a><span>›</span><a href="/cart">Giỏ hàng</a><span>›</span><b>Thanh toán</b>
      </div>
      <main className="checkout-page wrap">
        <section>
          <div className="page-title">
            <div><p className="eyebrow">THANH TOÁN AN TOÀN</p><h1>Hoàn tất đơn hàng</h1></div>
          </div>
          {cart.length === 0 ? (
            <div className="cart-empty-page">
              <span>◇</span>
              <h2>Chưa có sản phẩm để thanh toán</h2>
              <p>Thêm sản phẩm vào giỏ trước khi tiếp tục.</p>
              <a href="/#products">Khám phá sản phẩm</a>
            </div>
          ) : (
            <form className="checkout-page-form" onSubmit={submit}>
              <article>
                <span className="step-number">1</span>
                <div>
                  <h2>Thông tin nhận hàng</h2>
                  <div className="two-col">
                    <label>Họ và tên<input required name="name" defaultValue={profile?.name ?? ""} placeholder="Nguyễn Minh Anh" /></label>
                    <label>Số điện thoại<input required name="phone" defaultValue={profile?.phone ?? ""} placeholder="09xx xxx xxx" /></label>
                  </div>
                  <label>Email<input required type="email" name="email" defaultValue={profile?.email ?? ""} placeholder="hello@example.com" /></label>
                  <label>Địa chỉ nhận hàng<textarea required name="address" defaultValue={profile?.address ?? ""} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" /></label>
                  <label>Ghi chú giao hàng<textarea name="note" placeholder="Ví dụ: Gọi trước khi giao, gửi tại lễ tân..." /></label>
                </div>
              </article>
              <article>
                <span className="step-number">2</span>
                <div>
                  <h2>Phương thức giao hàng</h2>
                  <div className="checkout-shipping-grid">
                    {[
                      ["Tiêu chuẩn", "2–4 ngày", "Miễn phí", "◇"],
                      ["Nhanh", "1–2 ngày", formatPrice(39000), "⚡"],
                      ["Hỏa tốc", "Trong ngày", formatPrice(69000), "↗"],
                    ].map(([name, eta, fee, icon]) => (
                      <label className="checkout-radio" key={name}>
                        <input
                          type="radio"
                          name="shipping"
                          value={name}
                          checked={shipping === name}
                          onChange={() => setShipping(name)}
                        />
                        <span>{icon}</span>
                        <b>{name}<small>{eta} · {fee}</small></b>
                      </label>
                    ))}
                  </div>
                </div>
              </article>
              <article>
                <span className="step-number">3</span>
                <div>
                  <h2>Phương thức thanh toán</h2>
                  <div className="checkout-payment-grid">
                    {[
                      ["Ví điện tử", "MoMo, ZaloPay, VNPay", "◉"],
                      ["Thẻ ngân hàng", "Visa, Mastercard", "▭"],
                      ["Chuyển khoản", "Xác nhận thủ công", "⇄"],
                      ["Khi nhận hàng", "Thanh toán COD", "⌂"],
                    ].map(([name, note, icon]) => (
                      <label className="checkout-radio" key={name}>
                        <input
                          type="radio"
                          name="payment"
                          value={name}
                          checked={payment === name}
                          onChange={() => setPayment(name)}
                        />
                        <span>{icon}</span>
                        <b>{name}<small>{note}</small></b>
                      </label>
                    ))}
                  </div>
                  <p className="checkout-payment-note">
                    {payment === "Khi nhận hàng"
                      ? "Bạn thanh toán cho đơn vị vận chuyển khi nhận đủ hàng."
                      : "Đây là luồng mô phỏng; website không yêu cầu hoặc lưu thông tin tài chính thật."}
                  </p>
                </div>
              </article>
              <label className="checkout-consent">
                <input required type="checkbox" />
                <span>Tôi xác nhận thông tin giao hàng và đồng ý với <a href="/policies/terms">điều khoản mua hàng</a>.</span>
              </label>
              {checkoutError && (
                <p className="checkout-stock-error">{checkoutError}</p>
              )}
              <button className="primary-submit" disabled={hasStockIssue}>
                {hasStockIssue
                  ? "Kiểm tra lại tồn kho trong giỏ"
                  : `Đặt hàng · ${formatPrice(total)}`}
              </button>
              <small className="demo-disclaimer">
                Bản demo không thu thập hoặc xử lý dữ liệu thanh toán thật. Đơn
                hàng chỉ được lưu trên trình duyệt hiện tại.
              </small>
            </form>
          )}
        </section>

        <aside className="checkout-order-summary">
          <p className="eyebrow">ĐƠN HÀNG CỦA BẠN</p>
          <h2>{cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm</h2>
          <div>
            {cart.map((item) => (
              <article key={cartLineKey(item)}>
                <img src={item.image} alt={item.name} />
                <p>{item.name}<small>{item.variant ?? "Tiêu chuẩn"} · Số lượng: {item.quantity}</small></p>
                <b>{formatPrice(item.price * item.quantity)}</b>
              </article>
            ))}
          </div>
          <section>
            <p><span>Tạm tính</span><b>{formatPrice(subtotal)}</b></p>
            <p><span>Giảm giá{voucherCode ? ` · ${voucherCode}` : ""}</span><b className="free">− {formatPrice(appliedDiscount)}</b></p>
            <p><span>Vận chuyển · {shippingEta}</span><b className={shippingFee === 0 ? "free" : ""}>{shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}</b></p>
            <div><span>Tổng cộng<small>Đã bao gồm VAT</small></span><strong>{formatPrice(total)}</strong></div>
          </section>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
