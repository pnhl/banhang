"use client";

import { FormEvent, useState } from "react";

export function AdminLogin({ configured }: { configured: boolean }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: form.get("password") }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    if (response.ok) {
      window.location.reload();
      return;
    }
    setMessage(payload.message ?? "Không thể đăng nhập quản trị.");
    setLoading(false);
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <a className="brand" href="/">
          <span className="brand-mark">L</span>
          <span>
            LOPA<span>seller center</span>
          </span>
        </a>
        <div className="admin-login-icon">⌁</div>
        <p className="eyebrow">KHU VỰC ĐƯỢC BẢO VỆ</p>
        <h1>Đăng nhập quản trị</h1>
        <p>
          Vai trò admin được xác minh từ tài khoản nền tảng và danh sách email
          quản trị trên máy chủ.
        </p>
        <a
          className="admin-platform-login"
          href="/signin-with-chatgpt?return_to=%2Fadmin"
        >
          Đăng nhập bằng tài khoản quản trị →
        </a>
        {configured ? (
          <form className="admin-password-fallback" onSubmit={submit}>
            <small>Hoặc dùng mật khẩu khẩn cấp đã cấu hình</small>
            <label>
              Mật khẩu quản trị
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
              />
            </label>
            <button disabled={loading}>
              {loading ? "Đang xác minh…" : "Vào Seller Center →"}
            </button>
            {message && <div className="form-error">{message}</div>}
          </form>
        ) : (
          <div className="admin-config-warning">
            Chưa cấu hình mật khẩu khẩn cấp. Đăng nhập nền tảng vẫn hoạt động khi
            email nằm trong <b>ADMIN_EMAILS</b>.
          </div>
        )}
        <a className="admin-back-link" href="/">
          ← Quay lại gian hàng
        </a>
      </section>
    </main>
  );
}
