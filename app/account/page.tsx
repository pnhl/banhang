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
  signOutDemo,
} from "../lib/account";
import { formatPrice } from "../lib/catalog";

export default function AccountPage() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [orders, setOrders] = useState<NovaOrder[]>([]);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setProfile(getProfile());
    setOrders(getOrders());
  }, []);

  const totalSpent = useMemo(
    () =>
      orders
        .filter((order) => order.status !== "Đã hủy")
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
    saveProfile(next);
    setProfile(next);
    setEditing(false);
    setNotice("Đã cập nhật thông tin tài khoản.");
    window.setTimeout(() => setNotice(""), 2200);
  };

  if (!profile) {
    return (
      <>
        <SiteHeader />
        <main className="account-empty">
          <span>♙</span>
          <p className="eyebrow">TÀI KHOẢN NOVA</p>
          <h1>Đăng nhập để quản lý mua sắm.</h1>
          <p>Xem lịch sử đơn hàng, thông tin giao hàng và sản phẩm yêu thích tại một nơi.</p>
          <div><a href="/login">Đăng nhập</a><a href="/register">Tạo tài khoản</a></div>
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
          <div><p className="eyebrow">THÀNH VIÊN NOVA</p><h1>Xin chào, {profile.name}.</h1><p>{profile.email} · {profile.phone || "Chưa thêm số điện thoại"}</p></div>
          <button onClick={() => { signOutDemo(); setProfile(null); }}>Đăng xuất</button>
        </header>
        <section className="account-stats">
          <article><span>Đơn hàng</span><strong>{orders.length}</strong><small>Trên thiết bị này</small></article>
          <article><span>Tổng mua sắm</span><strong>{formatPrice(totalSpent)}</strong><small>Giá trị đơn đã tạo</small></article>
          <article><span>Hạng thành viên</span><strong>NOVA Seed</strong><small>Còn 2 đơn để lên hạng</small></article>
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
            <small>Dữ liệu tài khoản demo được lưu trên trình duyệt này, không gửi lên máy chủ.</small>
          </aside>
        </div>
      </main>
      {notice && <div className="toast"><span>✓</span>{notice}</div>}
      <SiteFooter />
    </>
  );
}
