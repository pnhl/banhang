"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { getProfile } from "../lib/account";
import { trackCommerceEvent } from "../lib/analytics";
import {
  CartLine,
  cartLineKey,
  formatPrice,
  getAdminStocks,
  getCart,
  getManagedProducts,
  PRODUCTS_UPDATED_EVENT,
  saveCart,
  validateVoucher,
  VOUCHERS_UPDATED_EVENT,
} from "../lib/catalog";
import { getSellerSubtotals } from "../lib/marketplace";

export default function CartPage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [voucher, setVoucher] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [stocks, setStocks] = useState<Record<number, number>>({});

  useEffect(() => {
    const current = getCart();
    setCart(current);
    const storedCode = window.sessionStorage.getItem("nova-voucher") ?? "";
    setVoucher(storedCode);
    setAppliedCode(storedCode);
    trackCommerceEvent("view_cart", {
      currency: "VND",
      value: current.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
      items: current.map((item) => ({
        item_id: String(item.id),
        item_name: item.name,
        item_category: item.category,
        item_variant: item.variant,
        price: item.price,
        quantity: item.quantity,
      })),
    });
    const syncCatalog = () =>
      setStocks(getAdminStocks(getManagedProducts()));
    syncCatalog();
    window.addEventListener(PRODUCTS_UPDATED_EVENT, syncCatalog);
    return () =>
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, syncCatalog);
  }, []);
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const total = Math.max(0, subtotal - discount);
  const hasStockIssue = cart.some(
    (item) => (stocks[item.id] ?? 0) < item.quantity,
  );

  useEffect(() => {
    const syncVoucher = () => {
      if (!appliedCode) {
        setDiscount(0);
        return;
      }
      const profile = getProfile();
      const validation = validateVoucher(appliedCode, {
        subtotal,
        customerKey:
          profile?.email?.toLowerCase() ||
          profile?.phone ||
          "guest",
        sellerSubtotals: getSellerSubtotals(cart),
      });
      setDiscount(validation.valid ? validation.discount : 0);
      if (!validation.valid) setVoucherMessage(validation.message);
    };
    syncVoucher();
    window.addEventListener(VOUCHERS_UPDATED_EVENT, syncVoucher);
    return () =>
      window.removeEventListener(VOUCHERS_UPDATED_EVENT, syncVoucher);
  }, [appliedCode, cart, subtotal]);

  const update = (key: string, quantity: number) => {
    const next = cart
      .map((item) =>
        cartLineKey(item) === key ? { ...item, quantity } : item,
      )
      .filter((item) => item.quantity > 0);
    setCart(next);
    saveCart(next);
  };

  const applyVoucher = () => {
    const code = voucher.trim().toUpperCase();
    const profile = getProfile();
    const validation = validateVoucher(code, {
      subtotal,
      customerKey:
        profile?.email?.toLowerCase() || profile?.phone || "guest",
      sellerSubtotals: getSellerSubtotals(cart),
    });
    if (!validation.valid || !validation.voucher) {
      setAppliedCode("");
      setDiscount(0);
      window.sessionStorage.removeItem("nova-voucher");
      setVoucherMessage(validation.message);
      return;
    }
    setVoucher(validation.code);
    setAppliedCode(validation.code);
    setDiscount(validation.discount);
    window.sessionStorage.setItem("nova-voucher", validation.code);
    setVoucherMessage(`✓ ${validation.voucher.label} · ${validation.message}`);
    trackCommerceEvent("select_promotion", {
      promotion_id: validation.voucher.code,
      promotion_name: validation.voucher.label,
      value: validation.discount,
      currency: "VND",
    });
  };

  return (
    <>
      <SiteHeader />
      <div className="page-breadcrumb wrap"><a href="/">Trang chủ</a><span>›</span><b>Giỏ hàng</b></div>
      <main className="cart-page wrap">
        <section className="cart-page-list">
          <div className="page-title"><div><p className="eyebrow">ĐƠN HÀNG CỦA BẠN</p><h1>Giỏ hàng</h1></div><span>{cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm</span></div>
          {cart.length === 0 ? (
            <div className="cart-empty-page"><span>▱</span><h2>Giỏ hàng đang trống</h2><p>Khám phá các sản phẩm chọn lọc và thêm món bạn thích vào đây.</p><a href="/#products">Khám phá sản phẩm</a></div>
          ) : cart.map((item) => {
            const key = cartLineKey(item);
            return (
            <article className="cart-page-line" key={key}>
              <a href={`/product/${item.id}`}><img src={item.image} alt={item.name} /></a>
              <div className="cart-line-copy"><p>{item.category}</p><a href={`/product/${item.id}`}>{item.name}</a><small>Phân loại: {item.variant ?? "Tiêu chuẩn"}</small><button onClick={() => update(key, 0)}>Xóa</button></div>
              <div className="cart-line-price"><strong>{formatPrice(item.price)}</strong><del>{formatPrice(item.oldPrice)}</del></div>
              <div className="detail-quantity"><button onClick={() => update(key, item.quantity - 1)} aria-label={`Giảm ${item.name}`}>−</button><b>{item.quantity}</b><button disabled={item.quantity >= Math.min(10, stocks[item.id] ?? 0)} onClick={() => update(key, Math.min(10, stocks[item.id] ?? 0, item.quantity + 1))} aria-label={`Tăng ${item.name}`}>＋</button>{(stocks[item.id] ?? 0) < item.quantity && <span className="cart-stock-warning">Kho chỉ còn {stocks[item.id] ?? 0}</span>}</div>
              <strong className="line-total">{formatPrice(item.price * item.quantity)}</strong>
            </article>
          )})}
          {cart.length > 0 && <a className="continue-shopping" href="/#products">← Tiếp tục mua sắm</a>}
        </section>

        <aside className="cart-order-box">
          <p className="eyebrow">TÓM TẮT ĐƠN HÀNG</p><h2>Thanh toán</h2>
          <div className="voucher-box"><label>Mã ưu đãi</label><div><input value={voucher} onChange={(e) => setVoucher(e.target.value.toUpperCase())} placeholder="Nhập mã ưu đãi" /><button onClick={applyVoucher}>Áp dụng</button></div>{voucherMessage && <small className={discount > 0 ? "" : "error"}>{voucherMessage}</small>}</div>
          <div className="order-totals"><p><span>Tạm tính</span><b>{formatPrice(subtotal)}</b></p><p><span>Giảm giá</span><b className="free">− {formatPrice(discount)}</b></p><p><span>Phí vận chuyển</span><b className="free">Miễn phí</b></p><div><span>Tổng cộng<small>Đã bao gồm VAT</small></span><strong>{formatPrice(total)}</strong></div></div>
          <button className="checkout-button" disabled={!cart.length || hasStockIssue} onClick={() => { window.location.href = "/checkout"; }}>{hasStockIssue ? "Kiểm tra lại tồn kho" : "Tiến hành thanh toán →"}</button>
          <p className="secure-note">♢ Thanh toán được mã hóa và bảo vệ</p>
          <div className="accepted-payment"><span>VISA</span><span>MC</span><span>MOMO</span><span>VNPAY</span></div>
        </aside>
      </main>

      <SiteFooter />
    </>
  );
}
