"use client";

import { FormEvent, useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirm")) return setMessage("Mật khẩu xác nhận chưa trùng khớp.");
    setMessage("Tài khoản demo đã được tạo. Bạn có thể đăng nhập ngay.");
  };
  return <><SiteHeader /><main className="auth-page register-page"><section className="auth-art"><div className="auth-orbit"><span>✦</span></div><p className="eyebrow">GIA NHẬP NOVA</p><h1>Mở khóa trải nghiệm mua sắm dành riêng cho bạn.</h1><p>Đăng ký trong một phút để nhận voucher chào mừng và quản lý mọi đơn hàng tại một nơi.</p><div><span>50K Voucher chào mừng</span><span>Freeship đơn đầu tiên</span></div></section><form className="auth-form" onSubmit={submit}><p className="eyebrow">TẠO TÀI KHOẢN</p><h2>Đăng ký thành viên</h2><p>Đã có tài khoản? <a href="/login">Đăng nhập</a></p><div className="two-col"><label>Họ và tên<input required name="name" placeholder="Nguyễn Minh Anh" /></label><label>Số điện thoại<input required name="phone" placeholder="09xx xxx xxx" /></label></div><label>Email<input required type="email" name="email" placeholder="hello@example.com" /></label><label>Mật khẩu<input required type="password" name="password" minLength={8} placeholder="Ít nhất 8 ký tự" /></label><label>Xác nhận mật khẩu<input required type="password" name="confirm" minLength={8} placeholder="Nhập lại mật khẩu" /></label><div className="auth-check"><label><input required type="checkbox" /> Tôi đồng ý với điều khoản và chính sách bảo mật</label></div><button>Tạo tài khoản</button>{message && <div className={message.startsWith("Mật") ? "form-error" : "form-success"}>{message}</div>}<small>Đây là biểu mẫu minh họa; thông tin không được gửi hoặc lưu trên máy chủ.</small></form></main><SiteFooter /></>;
}
