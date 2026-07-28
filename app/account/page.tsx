"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import {
  AccountProfile,
  getOrders,
  getProfile,
  NovaOrder,
  saveProfile,
} from "../lib/account";
import { formatPrice } from "../lib/catalog";

export default function AccountPage() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [orders, setOrders] = useState<NovaOrder[]>([]);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"customer" | "seller" | "admin">(
    "customer",
  );

  useEffect(() => {
    setLoading(true);
    const localProfile = getProfile();
    const localOrders = getOrders();
    setProfile(localProfile);
    setOrders(localOrders);
    void Promise.all([
      fetch("/api/me", { cache: "no-store" }),
      fetch("/api/orders", { cache: "no-store" }),
    ])
      .then(async ([meResponse, orderResponse]) => {
        if (meResponse.ok) {
          const result = (await meResponse.json()) as {
            authenticated?: boolean;
            user?: {
              displayName: string;
              email: string;
              phone: string;
              role: "customer" | "seller" | "admin";
            };
            address?: {
              recipient_name?: string;
              phone?: string;
              province_code?: number;
              province?: string;
              ward_code?: number;
              ward?: string;
              address_detail?: string;
            } | null;
          };
          if (result.authenticated && result.user) {
            const nextProfile: AccountProfile = {
              name: result.address?.recipient_name ?? result.user.displayName,
              email: result.user.email,
              phone: result.address?.phone ?? result.user.phone ?? "",
              provinceCode: result.address?.province_code,
              province: result.address?.province,
              wardCode: result.address?.ward_code,
              ward: result.address?.ward,
              addressDetail: result.address?.address_detail,
              address: [
                result.address?.address_detail,
                result.address?.ward,
                result.address?.province,
              ]
                .filter(Boolean)
                .join(", "),
            };
            setProfile(nextProfile);
            saveProfile(nextProfile);
            setRole(result.user.role);
          }
        }
        if (orderResponse.ok) {
          const result = (await orderResponse.json()) as {
            orders?: NovaOrder[];
          };
          const merged = [
            ...(result.orders ?? []),
            ...localOrders.filter(
              (local) =>
                !(result.orders ?? []).some((server) => server.id === local.id),
            ),
          ];
          setOrders(merged);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const totalSpent = useMemo(
    () =>
      orders
        .filter((order) => order.status !== "Đã hủy")
        .filter((order) => order.status !== "Chờ thanh toán")
        .reduce((sum, order) => sum + order.total, 0),
    [orders],
  );

  const updateProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;
    const form = new FormData(event.currentTarget);
    const addressDetail = String(form.get("addressDetail") ?? "");
    const next = {
      ...profile,
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      addressDetail,
      address:
        profile.province && profile.ward
          ? [addressDetail, profile.ward, profile.province]
              .filter(Boolean)
              .join(", ")
          : addressDetail,
    };
    void fetch("/api/me", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        phone: next.phone,
        address:
          next.province && next.ward && next.addressDetail
            ? {
                recipientName: next.name,
                phone: next.phone,
                provinceCode: next.provinceCode,
                province: next.province,
                wardCode: next.wardCode,
                ward: next.ward,
                addressDetail: next.addressDetail,
              }
            : undefined,
      }),
    });
    saveProfile(next);
    setProfile(next);
    setEditing(false);
    setNotice("Đã cập nhật thông tin tài khoản.");
    window.setTimeout(() => setNotice(""), 2200);
  };

  if (!profile && !loading) {
    return (
      <>
        <SiteHeader />
        <main className="account-empty">
          <span>♙</span>
          <p className="eyebrow">TÀI KHOẢN LOPA</p>
          <h1>Đăng nhập để quản lý mua sắm.</h1>
          <p>Xem lịch sử đơn hàng, thông tin giao hàng và sản phẩm yêu thích tại một nơi.</p>
          <div><a href="/login">Đăng nhập</a><a href="/register">Tạo tài khoản</a></div>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <SiteHeader />
        <main className="platform-loading account-loading">
          Đang đồng bộ hồ sơ D1…
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="account-page wrap">
        <header>
          <div className="account-avatar">{profile.name.slice(0, 1).toUpperCase()}</div>
          <div><p className="eyebrow">THÀNH VIÊN LOPA</p><h1>Xin chào, {profile.name}.</h1><p>{profile.email} · {profile.phone || "Chưa thêm số điện thoại"}</p></div>
          <div className="account-header-actions">
            {role !== "customer" && <a href="/seller">Seller Center</a>}
            <a href="/notifications">Thông báo</a>
            <a href="/signout-with-chatgpt?return_to=%2F">Đăng xuất</a>
          </div>
        </header>
        <section className="account-stats">
          <article><span>Đơn hàng</span><strong>{orders.length}</strong><small>Đồng bộ từ D1 và thiết bị</small></article>
          <article><span>Tổng mua sắm</span><strong>{formatPrice(totalSpent)}</strong><small>Giá trị đơn đã tạo</small></article>
          <article><span>Hạng thành viên</span><strong>LOPA Seed</strong><small>Còn 2 đơn để lên hạng</small></article>
        </section>
        <div className="account-grid">
          <section className="account-orders">
            <div className="account-section-heading"><div><p className="eyebrow">LỊCH SỬ MUA HÀNG</p><h2>Đơn hàng gần đây</h2></div><a href="/#products">Mua thêm →</a></div>
            {orders.length === 0 ? (
              <div className="account-no-orders"><span>◇</span><h3>Chưa có đơn hàng</h3><p>Đơn đặt từ trang thanh toán sẽ xuất hiện tại đây.</p><a href="/#products">Khám phá sản phẩm</a></div>
            ) : orders.map((order) => (
              <article className="account-order" key={order.id}>
                <div><b>#{order.id}</b><small>{new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(order.createdAt))}</small></div>
                <div className="account-order-products">
                  {order.items.slice(0, 3).map((item) => <img key={item.id} src={item.image} alt={item.name} />)}
                  <p>{order.items[0]?.name}{order.items.length > 1 && ` +${order.items.length - 1} sản phẩm`}<small>{order.items.reduce((sum, item) => sum + item.quantity, 0)} món · {order.payment}</small></p>
                </div>
                <strong>{formatPrice(order.total)}</strong>
                <div className="account-order-actions">
                  <span className={`account-order-status status-${order.status.replaceAll(" ", "-").toLowerCase()}`}>{order.status}</span>
                  <a href={`/orders/${order.id}`}>Chi tiết →</a>
                </div>
              </article>
            ))}
          </section>
          <aside className="account-profile-card">
            <div className="account-section-heading"><div><p className="eyebrow">HỒ SƠ</p><h2>Thông tin cá nhân</h2></div><button onClick={() => setEditing((value) => !value)}>{editing ? "Hủy" : "Chỉnh sửa"}</button></div>
            {editing ? (
              <form onSubmit={updateProfile}>
                <label>Họ và tên<input name="name" required defaultValue={profile.name} /></label>
                <label>Email<input name="email" type="email" required defaultValue={profile.email} /></label>
                <label>Số điện thoại<input name="phone" defaultValue={profile.phone} /></label>
                {profile.province && (
                  <label>
                    Tỉnh/Thành phố
                    <input value={profile.province} disabled />
                  </label>
                )}
                {profile.ward && (
                  <label>
                    Phường/Xã
                    <input value={profile.ward} disabled />
                  </label>
                )}
                <label>Địa chỉ chi tiết<textarea name="addressDetail" defaultValue={profile.addressDetail ?? profile.address ?? ""} /></label>
                <button>Lưu thay đổi</button>
              </form>
            ) : (
              <dl>
                <div><dt>Họ và tên</dt><dd>{profile.name}</dd></div>
                <div><dt>Email</dt><dd>{profile.email}</dd></div>
                <div><dt>Số điện thoại</dt><dd>{profile.phone || "Chưa cập nhật"}</dd></div>
                <div><dt>Tỉnh/Thành phố</dt><dd>{profile.province || "Chưa cập nhật"}</dd></div>
                <div><dt>Phường/Xã</dt><dd>{profile.ward || "Chưa cập nhật"}</dd></div>
                <div><dt>Địa chỉ chi tiết</dt><dd>{profile.addressDetail || profile.address || "Chưa cập nhật"}</dd></div>
              </dl>
            )}
            <small>Email và vai trò do phiên đăng nhập xác thực; hồ sơ giao hàng được lưu trong D1.</small>
          </aside>
        </div>
      </main>
      {notice && <div className="toast"><span>✓</span>{notice}</div>}
      <SiteFooter />
    </>
  );
}
