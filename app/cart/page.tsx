"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { CartLine, formatPrice, getCart, saveCart } from "../lib/catalog";

export default function CartPage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [voucher, setVoucher] = useState("");
  const [discount, setDiscount] = useState(0);
  const [checkout, setCheckout] = useState(false);
  const [ordered, setOrdered] = useState(false);

  useEffect(() => setCart(getCart()), []);
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const total = Math.max(0, subtotal - discount);

  const update = (id: number, quantity: number) => {
    const next = cart.map((item) => item.id === id ? { ...item, quantity } : item).filter((item) => item.quantity > 0);
    setCart(next);
    saveCart(next);
  };

  const applyVoucher = () => {
    if (voucher.trim().toUpperCase() === "NOVA50") setDiscount(Math.min(50000, subtotal));
    else setDiscount(0);
  };

  if (ordered) return <><SiteHeader /><main className="order-success"><span>✓</span><p className="eyebrow">ĐẶT HÀNG THÀNH CÔNG</p><h1>Cảm ơn bạn đã chọn NOVA.</h1><p>Mã đơn <b>#NV240726</b> đã được ghi nhận. Chúng tôi sẽ gửi cập nhật hành trình đơn hàng qua email.</p><div><a href="/">Tiếp tục mua sắm</a><a href="/login">Xem đơn hàng</a></div></main><SiteFooter /></>;

  return (
    <>
      <SiteHeader />
      <div className="page-breadcrumb wrap"><a href="/">Trang chủ</a><span>›</span><b>Giỏ hàng</b></div>
      <main className="cart-page wrap">
        <section className="cart-page-list">
          <div className="page-title"><div><p className="eyebrow">ĐƠN HÀNG CỦA BẠN</p><h1>Giỏ hàng</h1></div><span>{cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm</span></div>
          {cart.length === 0 ? (
            <div className="cart-empty-page"><span>▱</span><h2>Giỏ hàng đang trống</h2><p>Khám phá các sản phẩm chọn lọc và thêm món bạn thích vào đây.</p><a href="/#products">Khám phá sản phẩm</a></div>
          ) : cart.map((item) => (
            <article className="cart-page-line" key={item.id}>
              <a href={`/product/${item.id}`}><img src={item.image} alt={item.name} /></a>
              <div className="cart-line-copy"><p>{item.category}</p><a href={`/product/${item.id}`}>{item.name}</a><small>Phân loại: Tiêu chuẩn</small><button onClick={() => update(item.id, 0)}>Xóa</button></div>
              <div className="cart-line-price"><strong>{formatPrice(item.price)}</strong><del>{formatPrice(item.oldPrice)}</del></div>
              <div className="detail-quantity"><button onClick={() => update(item.id, item.quantity - 1)}>−</button><b>{item.quantity}</b><button onClick={() => update(item.id, item.quantity + 1)}>＋</button></div>
              <strong className="line-total">{formatPrice(item.price * item.quantity)}</strong>
            </article>
          ))}
          {cart.length > 0 && <a className="continue-shopping" href="/#products">← Tiếp tục mua sắm</a>}
        </section>

        <aside className="cart-order-box">
          <p className="eyebrow">TÓM TẮT ĐƠN HÀNG</p><h2>Thanh toán</h2>
          <div className="voucher-box"><label>Mã ưu đãi</label><div><input value={voucher} onChange={(e) => setVoucher(e.target.value)} placeholder="Nhập NOVA50" /><button onClick={applyVoucher}>Áp dụng</button></div>{discount > 0 && <small>✓ Đã áp dụng ưu đãi 50.000đ</small>}</div>
          <div className="order-totals"><p><span>Tạm tính</span><b>{formatPrice(subtotal)}</b></p><p><span>Giảm giá</span><b className="free">− {formatPrice(discount)}</b></p><p><span>Phí vận chuyển</span><b className="free">Miễn phí</b></p><div><span>Tổng cộng<small>Đã bao gồm VAT</small></span><strong>{formatPrice(total)}</strong></div></div>
          <button className="checkout-button" disabled={!cart.length} onClick={() => setCheckout(true)}>Tiến hành thanh toán →</button>
          <p className="secure-note">♢ Thanh toán được mã hóa và bảo vệ</p>
          <div className="accepted-payment"><span>VISA</span><span>MC</span><span>MOMO</span><span>VNPAY</span></div>
        </aside>
      </main>

      {checkout && (
        <div className="modal-backdrop" onMouseDown={() => setCheckout(false)}>
          <section className="checkout-modal cart-checkout" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setCheckout(false)}>×</button>
            <form className="checkout-form" onSubmit={(e) => { e.preventDefault(); saveCart([]); setCart([]); setCheckout(false); setOrdered(true); }}>
              <p className="eyebrow">THANH TOÁN AN TOÀN</p><h2>Thông tin nhận hàng</h2>
              <div className="two-col"><label>Họ và tên<input required placeholder="Nguyễn Minh Anh" /></label><label>Số điện thoại<input required placeholder="09xx xxx xxx" /></label></div>
              <label>Email<input required type="email" placeholder="hello@example.com" /></label>
              <label>Địa chỉ nhận hàng<input required placeholder="Số nhà, đường, phường/xã, quận/huyện" /></label>
              <h3>Phương thức thanh toán</h3>
              <div className="payment-options"><label><input type="radio" name="pay" defaultChecked /><span>◎</span><b>Ví điện tử<small>MoMo, ZaloPay</small></b></label><label><input type="radio" name="pay" /><span>▭</span><b>Thẻ ngân hàng<small>Visa, Mastercard</small></b></label><label><input type="radio" name="pay" /><span>⇄</span><b>Chuyển khoản<small>Xác nhận tự động</small></b></label></div>
              <button className="primary-submit">Đặt hàng · {formatPrice(total)}</button>
              <small className="demo-disclaimer">Bản demo không thu thập hoặc xử lý thông tin thanh toán thật.</small>
            </form>
            <aside className="checkout-summary"><h3>Đơn hàng ({cart.length})</h3>{cart.slice(0, 4).map((item) => <div className="checkout-line" key={item.id}><img src={item.image} alt="" /><p>{item.name}<small>Số lượng: {item.quantity}</small></p><b>{formatPrice(item.price * item.quantity)}</b></div>)}<div className="checkout-total"><span>Tổng thanh toán</span><strong>{formatPrice(total)}</strong></div></aside>
          </section>
        </div>
      )}
      <SiteFooter />
    </>
  );
}
