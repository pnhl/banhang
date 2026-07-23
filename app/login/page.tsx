"use client";

import { FormEvent, useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export default function LoginPage() {
  const [message, setMessage] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("Đăng nhập demo thành công. Đang chuyển đến trang mua sắm…");
    window.setTimeout(() => { window.location.href = "/"; }, 900);
  };
  return <><SiteHeader /><main className="auth-page"><section className="auth-art"><div className="auth-orbit"><span>N</span></div><p className="eyebrow">THÀNH VIÊN NOVA</p><h1>Mua sắm dễ hơn khi mọi thứ được ghi nhớ.</h1><p>Lưu sản phẩm yêu thích, theo dõi đơn hàng và nhận ưu đãi phù hợp với bạn.</p><div><span>✓ Đổi trả 15 ngày</span><span>✓ Ưu đãi thành viên</span><span>✓ Theo dõi đơn hàng</span></div></section><form className="auth-form" onSubmit={submit}><p className="eyebrow">CHÀO BẠN TRỞ LẠI</p><h2>Đăng nhập</h2><p>Chưa có tài khoản? <a href="/register">Đăng ký miễn phí</a></p><label>Email hoặc số điện thoại<input required placeholder="hello@example.com" /></label><label>Mật khẩu<span><a href="#">Quên mật khẩu?</a></span><input required type="password" placeholder="Tối thiểu 8 ký tự" minLength={8} /></label><div className="auth-check"><label><input type="checkbox" /> Ghi nhớ tôi</label></div><button>Đăng nhập</button><div className="auth-divider"><span>hoặc tiếp tục với</span></div><div className="social-auth"><button type="button">G Google</button><button type="button">● Apple</button></div>{message && <div className="form-success">✓ {message}</div>}<small>Bằng việc đăng nhập, bạn đồng ý với <a href="/policies/terms">Điều khoản</a> và <a href="/policies/privacy">Chính sách bảo mật</a>.</small></form></main><SiteFooter /></>;
}
