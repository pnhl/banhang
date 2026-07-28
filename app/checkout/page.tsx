"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
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
  const [payment, setPayment] = useState("payOS · VietQR");
  const [provinces, setProvinces] = useState<VietnamProvince[]>([]);
  const [wards, setWards] = useState<VietnamWard[]>([]);
  const [provinceCode, setProvinceCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [manualWard, setManualWard] = useState("");
  const [provincesLoading, setProvincesLoading] = useState(true);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [wardFallback, setWardFallback] = useState(false);
  const [locationNotice, setLocationNotice] = useState("");
  const [payOSLoading, setPayOSLoading] = useState(false);
  const [payOSSession, setPayOSSession] = useState<{
    orderId: string;
    orderCode: number;
    amount: number;
    status: string;
    checkoutUrl: string;
    qrCode: string;
    expiresAt: string;
    order: ReturnType<typeof createOrder>;
  } | null>(null);

  useEffect(() => {
    const currentCart = getCart();
    setCart(currentCart);
    const returnedOrderCode = Number(
      new URLSearchParams(window.location.search).get("orderCode"),
    );
    if (Number.isSafeInteger(returnedOrderCode) && returnedOrderCode > 0) {
      void fetch(`/api/payments/payos/${returnedOrderCode}`, {
        cache: "no-store",
      })
        .then(async (paymentResponse) => {
          if (!paymentResponse.ok) return null;
          const paymentResult = (await paymentResponse.json()) as {
            payment?: {
              orderId: string;
              orderCode: number;
              amount: number;
              status: string;
              checkoutUrl: string;
              qrCode: string;
              expiresAt: string;
            };
          };
          if (!paymentResult.payment) return null;
          const orderResponse = await fetch(
            `/api/orders/${paymentResult.payment.orderId}`,
            { cache: "no-store" },
          );
          if (!orderResponse.ok) return null;
          const orderResult = (await orderResponse.json()) as {
            order?: ReturnType<typeof createOrder>;
          };
          return orderResult.order
            ? { ...paymentResult.payment, order: orderResult.order }
            : null;
        })
        .then((session) => {
          if (!session) return;
          if (session.status === "PAID") {
            const paidOrder = {
              ...session.order,
              status: "Chờ xác nhận" as const,
              invoiceStatus: "provider-confirmed" as const,
              serverPersisted: true,
            };
            saveOrders([
              paidOrder,
              ...getOrders().filter((item) => item.id !== paidOrder.id),
            ]);
            saveCart([]);
            setCart([]);
            setOrderId(paidOrder.id);
          } else {
            setPayOSSession(session);
          }
        })
        .catch(() => undefined);
    }
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
    void fetch("/api/inventory", { cache: "no-store" })
      .then(async (response) =>
        response.ok
          ? ((await response.json()) as {
            inventory?: Array<{ productId: number; available: number }>;
          })
          : null,
      )
      .then((result) => {
          if (!result?.inventory) return;
          setStocks(
            Object.fromEntries(
              result.inventory.map((item) => [
                Number(item.productId),
                Number(item.available),
              ]),
            ),
          );
        },
      )
      .catch(() => undefined);
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

  useEffect(() => {
    if (!payOSSession || payOSSession.status !== "PENDING") return;
    let active = true;
    const poll = async () => {
      const response = await fetch(
        `/api/payments/payos/${payOSSession.orderCode}`,
        { cache: "no-store" },
      );
      const result = (await response.json().catch(() => ({}))) as {
        payment?: { status?: string };
      };
      if (!active || !result.payment?.status) return;
      const status = result.payment.status;
      if (status === "PAID") {
        const paidOrder = {
          ...payOSSession.order,
          status: "Chờ xác nhận" as const,
          invoiceStatus: "provider-confirmed" as const,
          serverPersisted: true,
        };
        saveOrders([
          paidOrder,
          ...getOrders().filter((item) => item.id !== paidOrder.id),
        ]);
        const nextStocks = { ...stocks };
        cart.forEach((item) => {
          nextStocks[item.id] = Math.max(
            0,
            (nextStocks[item.id] ?? 0) - item.quantity,
          );
        });
        saveAdminStocks(nextStocks);
        saveCart([]);
        window.sessionStorage.removeItem("nova-voucher");
        setCart([]);
        setOrderId(paidOrder.id);
        setPayOSSession(null);
        trackCommerceEvent("purchase", {
          transaction_id: paidOrder.id,
          value: paidOrder.total,
          tax: paidOrder.taxAmount ?? 0,
          shipping: paidOrder.shippingFee ?? 0,
          currency: "VND",
          payment_type: "payOS",
        });
      } else if (["CANCELLED", "EXPIRED", "FAILED"].includes(status)) {
        setPayOSSession((current) =>
          current ? { ...current, status } : current,
        );
        setCheckoutError(
          status === "EXPIRED"
            ? "Mã QR đã hết hạn. Tồn kho giữ chỗ đã được hoàn lại."
            : "Thanh toán đã dừng. Tồn kho giữ chỗ đã được hoàn lại.",
        );
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [cart, payOSSession, stocks]);

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
    if (payment === "payOS · VietQR") {
      setPayOSLoading(true);
      setCheckoutError("");
      try {
        const response = await fetch("/api/payments/payos", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            items: cart.map((item) => ({
              id: item.id,
              quantity: item.quantity,
              variant: item.variant,
            })),
            customer,
            shippingMethod: shipping,
            shippingNote: String(form.get("note") ?? ""),
            voucherCode: voucherValidation?.code ?? "",
          }),
        });
        const result = (await response.json().catch(() => ({}))) as {
          message?: string;
          orderId?: string;
          orderCode?: number;
          amount?: number;
          status?: string;
          checkoutUrl?: string;
          qrCode?: string;
          expiresAt?: string;
          order?: ReturnType<typeof createOrder>;
        };
        if (
          !response.ok ||
          !result.orderId ||
          !result.orderCode ||
          !result.qrCode ||
          !result.checkoutUrl ||
          !result.order
        ) {
          throw new Error(
            response.status === 401
              ? "Vui lòng đăng nhập tài khoản LOPA trước khi thanh toán bằng payOS."
              : result.message ?? "Chưa thể tạo mã QR payOS.",
          );
        }
        setPayOSSession({
          orderId: result.orderId,
          orderCode: result.orderCode,
          amount: Number(result.amount ?? finalTotal),
          status: result.status ?? "PENDING",
          checkoutUrl: result.checkoutUrl,
          qrCode: result.qrCode,
          expiresAt:
            result.expiresAt ??
            new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          order: result.order,
        });
        return;
      } catch (error) {
        setCheckoutError(
          error instanceof Error
            ? error.message
            : "Chưa thể tạo mã QR payOS.",
        );
        return;
      } finally {
        setPayOSLoading(false);
      }
    }
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

  if (payOSSession) {
    const isPending = payOSSession.status === "PENDING";
    return (
      <>
        <SiteHeader />
        <main className="payos-page wrap">
          <section className="payos-card">
            <div className="payos-qr-panel">
              <p className="eyebrow">THANH TOÁN PAYOS</p>
              <div className="payos-qr">
                <QRCodeSVG
                  value={payOSSession.qrCode}
                  size={250}
                  level="M"
                  marginSize={2}
                  title={`QR thanh toán đơn ${payOSSession.orderId}`}
                />
              </div>
              <small>Quét bằng ứng dụng ngân hàng hỗ trợ VietQR</small>
            </div>
            <div className="payos-details">
              <span className={`payos-status ${payOSSession.status.toLowerCase()}`}>
                {isPending ? "Đang chờ thanh toán" : payOSSession.status}
              </span>
              <p className="eyebrow">ĐƠN #{payOSSession.orderId}</p>
              <h1>{formatPrice(payOSSession.amount)}</h1>
              <p>
                Số tiền và nội dung chuyển khoản đã được payOS gắn trực tiếp
                trong mã QR. Trạng thái được kiểm tra tự động mỗi 3 giây.
              </p>
              <dl>
                <div><dt>Mã payOS</dt><dd>{payOSSession.orderCode}</dd></div>
                <div>
                  <dt>Hết hạn</dt>
                  <dd>
                    {new Intl.DateTimeFormat("vi-VN", {
                      timeStyle: "short",
                      dateStyle: "short",
                    }).format(new Date(payOSSession.expiresAt))}
                  </dd>
                </div>
              </dl>
              <a
                className="payos-open"
                href={payOSSession.checkoutUrl}
                target="_blank"
                rel="noreferrer"
              >
                Mở trang thanh toán payOS →
              </a>
              {isPending ? (
                <button
                  className="payos-cancel"
                  onClick={async () => {
                    await fetch(
                      `/api/payments/payos/${payOSSession.orderCode}`,
                      { method: "DELETE" },
                    );
                    setPayOSSession((current) =>
                      current ? { ...current, status: "CANCELLED" } : current,
                    );
                  }}
                >
                  Hủy thanh toán
                </button>
              ) : (
                <button
                  className="payos-cancel"
                  onClick={() => setPayOSSession(null)}
                >
                  Quay lại thanh toán
                </button>
              )}
              {checkoutError && (
                <p className="checkout-stock-error">{checkoutError}</p>
              )}
              <small className="payos-security-note">
                LOPA không nhận dữ liệu đăng nhập ngân hàng. Chỉ webhook payOS
                có chữ ký hợp lệ mới được phép xác nhận đơn.
              </small>
            </div>
          </section>
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
              <small>payOS · VietQR — QR đúng tổng tiền, tự xác nhận.</small>
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
                      ["payOS · VietQR", "QR đúng tổng tiền, tự xác nhận", "QR"],
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
                      : payment === "payOS · VietQR"
                        ? "payOS tạo mã VietQR theo đúng tổng đơn và webhook tự động xác nhận sau khi tiền về."
                        : "Các phương thức khác vẫn là luồng mô phỏng và không lưu thông tin tài chính."}
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
                  hasStockIssue ||
                  provincesLoading ||
                  wardsLoading ||
                  payOSLoading
                }
              >
                {payOSLoading
                  ? "Đang tạo mã QR payOS…"
                  : provincesLoading || wardsLoading
                  ? "Đang chuẩn bị dữ liệu địa chỉ..."
                  : hasStockIssue
                  ? "Kiểm tra lại tồn kho trong giỏ"
                  : `Đặt hàng · ${formatPrice(total)}`}
              </button>
              <small className="demo-disclaimer">
                payOS là luồng thanh toán thật khi khóa môi trường được cấu hình.
                COD, ví và thẻ còn lại vẫn là mô phỏng.
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
