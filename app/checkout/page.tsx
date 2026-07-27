"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import {
  AccountProfile,
  createOrder,
  getOrders,
  getProfile,
  saveOrders,
  saveProfile,
} from "../lib/account";
import { trackCommerceEvent } from "../lib/analytics";
import {
  CartLine,
  cartLineKey,
  formatPrice,
  getAdminStocks,
  getCart,
  getManagedProducts,
  PRODUCTS_UPDATED_EVENT,
  recordVoucherRedemption,
  saveAdminStocks,
  saveCart,
  validateVoucher,
  VOUCHERS_UPDATED_EVENT,
} from "../lib/catalog";
import {
  calculateIncludedTax,
  getBusinessProfile,
} from "../lib/invoicing";
import {
  loadProvinces,
  loadWards,
  VietnamProvince,
  VietnamWard,
} from "../lib/locations";
import {
  allocateOrderBySeller,
  getSellerForProduct,
  getSellerSubtotals,
} from "../lib/marketplace";

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
  const [provinces, setProvinces] = useState<VietnamProvince[]>([]);
  const [wards, setWards] = useState<VietnamWard[]>([]);
  const [provinceCode, setProvinceCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [manualWard, setManualWard] = useState("");
  const [provincesLoading, setProvincesLoading] = useState(true);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [wardFallback, setWardFallback] = useState(false);
  const [locationNotice, setLocationNotice] = useState("");

  useEffect(() => {
    const currentCart = getCart();
    setCart(currentCart);
    trackCommerceEvent("begin_checkout", {
      currency: "VND",
      value: currentCart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
      items: currentCart.map((item) => ({
        item_id: String(item.id),
        item_name: item.name,
        item_category: item.category,
        item_brand: getSellerForProduct(item.id).name,
        item_variant: item.variant,
        price: item.price,
        quantity: item.quantity,
      })),
    });
    const storedProfile = getProfile();
    setProfile(storedProfile);
    setProvinceCode(
      storedProfile?.provinceCode
        ? String(storedProfile.provinceCode)
        : "",
    );
    setWardCode(
      storedProfile?.wardCode ? String(storedProfile.wardCode) : "",
    );
    setManualWard(storedProfile?.ward ?? "");
    loadProvinces().then((result) => {
      setProvinces(result.items);
      setProvincesLoading(false);
      if (result.fromFallback) {
        setLocationNotice(
          "Đang dùng danh sách tỉnh/thành dự phòng. Phường/xã có thể nhập thủ công nếu dịch vụ địa giới chưa phản hồi.",
        );
      }
    });
    setVoucherCode(window.sessionStorage.getItem("nova-voucher") ?? "");
    const syncStocks = () =>
      setStocks(getAdminStocks(getManagedProducts()));
    syncStocks();
    window.addEventListener(PRODUCTS_UPDATED_EVENT, syncStocks);
    return () =>
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, syncStocks);
  }, []);

  useEffect(() => {
    if (!provinceCode) {
      setWards([]);
      setWardFallback(false);
      return;
    }
    let active = true;
    setWardsLoading(true);
    setWardFallback(false);
    loadWards(Number(provinceCode)).then((result) => {
      if (!active) return;
      setWards(result.items);
      setWardFallback(result.fromFallback || result.items.length === 0);
      setWardCode((current) =>
        result.items.some((ward) => String(ward.code) === current)
          ? current
          : "",
      );
      setWardsLoading(false);
      if (result.fromFallback) {
        setLocationNotice(
          "Không tải được danh sách phường/xã. Bạn vẫn có thể nhập phường/xã thủ công.",
        );
      } else {
        setLocationNotice("");
      }
    });
    return () => {
      active = false;
    };
  }, [provinceCode]);

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
      if (!voucherCode) {
        setDiscount(0);
        return;
      }
      const validation = validateVoucher(voucherCode, {
        subtotal,
        customerKey:
          profile?.email?.toLowerCase() ||
          profile?.phone ||
          "guest",
        sellerSubtotals: getSellerSubtotals(cart),
      });
      setDiscount(validation.valid ? validation.discount : 0);
      if (!validation.valid) setCheckoutError(validation.message);
    };
    syncVoucher();
    window.addEventListener(VOUCHERS_UPDATED_EVENT, syncVoucher);
    return () =>
      window.removeEventListener(VOUCHERS_UPDATED_EVENT, syncVoucher);
  }, [cart, profile, subtotal, voucherCode]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (hasStockIssue) {
      setCheckoutError(
        "Một hoặc nhiều sản phẩm không còn đủ tồn kho. Vui lòng quay lại giỏ hàng để điều chỉnh.",
      );
      return;
    }
    const form = new FormData(event.currentTarget);
    const selectedProvince = provinces.find(
      (province) => String(province.code) === provinceCode,
    );
    const selectedWard = wards.find(
      (ward) => String(ward.code) === wardCode,
    );
    const wardName = wardFallback
      ? String(form.get("manualWard") ?? "").trim()
      : selectedWard?.name ?? "";
    const addressDetail = String(
      form.get("addressDetail") ?? "",
    ).trim();
    if (!selectedProvince || !wardName || !addressDetail) {
      setCheckoutError(
        "Vui lòng chọn đầy đủ tỉnh/thành phố, phường/xã và nhập địa chỉ chi tiết.",
      );
      return;
    }
    const customer = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      provinceCode: selectedProvince.code,
      province: selectedProvince.name,
      wardCode: selectedWard?.code,
      ward: wardName,
      addressDetail,
      address: [addressDetail, wardName, selectedProvince.name].join(", "),
    };
    const voucherValidation = voucherCode
      ? validateVoucher(voucherCode, {
          subtotal,
          customerKey:
            customer.email.toLowerCase() || customer.phone || "guest",
          sellerSubtotals: getSellerSubtotals(cart),
        })
      : null;
    if (voucherCode && !voucherValidation?.valid) {
      setCheckoutError(
        voucherValidation?.message ??
          "Mã ưu đãi không còn đủ điều kiện áp dụng.",
      );
      return;
    }
    const finalDiscount = voucherValidation?.discount ?? 0;
    const finalTotal = Math.max(
      0,
      subtotal - finalDiscount + shippingFee,
    );
    const business = getBusinessProfile();
    const taxBreakdown = calculateIncludedTax(
      finalTotal,
      business.vatRate,
    );
    const allocations = allocateOrderBySeller(
      cart,
      finalDiscount,
      taxBreakdown.tax,
    );
    saveProfile(customer);
    const order = createOrder({
      customer,
      items: cart,
      payment: String(form.get("payment") ?? "Ví điện tử"),
      shippingMethod: shipping,
      shippingFee,
      shippingNote: String(form.get("note") ?? ""),
      subtotal,
      discount: finalDiscount,
      total: finalTotal,
      voucherCode: voucherValidation?.code,
      amountBeforeTax: taxBreakdown.beforeTax,
      taxAmount: taxBreakdown.tax,
      invoiceStatus: "issued-demo",
      business,
      sellerAllocations: allocations,
      serverPersisted: false,
    });
    if (voucherValidation?.code && finalDiscount > 0) {
      recordVoucherRedemption({
        code: voucherValidation.code,
        orderId: order.id,
        customerKey:
          customer.email.toLowerCase() || customer.phone || "guest",
        sellerId: voucherValidation.voucher?.sellerId,
        amount: finalDiscount,
      });
    }
    try {
      const response = await fetch("/api/marketplace/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        persisted?: boolean;
      };
      if (response.ok && result.persisted) {
        order.serverPersisted = true;
        saveOrders(
          getOrders().map((item) =>
            item.id === order.id
              ? { ...item, serverPersisted: true }
              : item,
          ),
        );
      }
    } catch {
      // The device-local order remains available when server persistence fails.
    }
    trackCommerceEvent("purchase", {
      transaction_id: order.id,
      value: finalTotal,
      tax: taxBreakdown.tax,
      shipping: shippingFee,
      currency: "VND",
      coupon: voucherValidation?.code ?? "",
      user_key: customer.email.toLowerCase(),
      items: cart.map((item) => ({
        item_id: String(item.id),
        item_name: item.name,
        item_category: item.category,
        item_brand: getSellerForProduct(item.id).name,
        item_variant: item.variant,
        price: item.price,
        quantity: item.quantity,
      })),
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
          <h1>Cảm ơn bạn đã chọn LOPA.</h1>
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
                  <div className="checkout-location-grid">
                    <label>
                      Tỉnh / Thành phố
                      <select
                        required
                        value={provinceCode}
                        disabled={provincesLoading}
                        onChange={(event) => {
                          setProvinceCode(event.target.value);
                          setWardCode("");
                          setManualWard("");
                          setCheckoutError("");
                        }}
                      >
                        <option value="">
                          {provincesLoading
                            ? "Đang tải tỉnh/thành phố..."
                            : "Chọn tỉnh/thành phố"}
                        </option>
                        {provinces.map((province) => (
                          <option value={province.code} key={province.code}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Phường / Xã
                      {wardFallback ? (
                        <input
                          required
                          name="manualWard"
                          value={manualWard}
                          onChange={(event) =>
                            setManualWard(event.target.value)
                          }
                          placeholder="Nhập tên phường/xã"
                        />
                      ) : (
                        <select
                          required
                          value={wardCode}
                          disabled={!provinceCode || wardsLoading}
                          onChange={(event) => {
                            setWardCode(event.target.value);
                            setCheckoutError("");
                          }}
                        >
                          <option value="">
                            {!provinceCode
                              ? "Chọn tỉnh/thành phố trước"
                              : wardsLoading
                                ? "Đang tải phường/xã..."
                                : "Chọn phường/xã"}
                          </option>
                          {wards.map((ward) => (
                            <option value={ward.code} key={ward.code}>
                              {ward.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </label>
                  </div>
                  <label>
                    Địa chỉ chi tiết
                    <textarea
                      required
                      name="addressDetail"
                      defaultValue={
                        profile?.addressDetail ??
                        (profile?.province ? "" : profile?.address ?? "")
                      }
                      placeholder="Số nhà, tên đường, tòa nhà, căn hộ..."
                    />
                  </label>
                  <small className="checkout-location-note">
                    {locationNotice ||
                      "Địa chỉ áp dụng mô hình hành chính hai cấp: tỉnh/thành phố → phường/xã."}
                  </small>
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
                          onChange={() => {
                            setShipping(name);
                            trackCommerceEvent("add_shipping_info", {
                              shipping_tier: name,
                              value: total,
                              currency: "VND",
                            });
                          }}
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
                          onChange={() => {
                            setPayment(name);
                            trackCommerceEvent("add_payment_info", {
                              payment_type: name,
                              value: total,
                              currency: "VND",
                            });
                          }}
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
              <button
                className="primary-submit"
                disabled={
                  hasStockIssue || provincesLoading || wardsLoading
                }
              >
                {provincesLoading || wardsLoading
                  ? "Đang chuẩn bị dữ liệu địa chỉ..."
                  : hasStockIssue
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
