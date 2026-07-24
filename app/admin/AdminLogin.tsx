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
          <span className="brand-mark">N</span>
          <span>
            NOVA<span>seller center</span>
          </span>
        </a>
        <div className="admin-login-icon">⌁</div>
        <p className="eyebrow">KHU VỰC ĐƯỢC BẢO VỆ</p>
        <h1>Đăng nhập quản trị</h1>
        <p>
          Nhập mật khẩu quản trị để xem đơn hàng, khách hàng và báo cáo vận
          hành.
        </p>
        {configured ? (
          <form onSubmit={submit}>
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
            Chưa cấu hình biến môi trường <b>ADMIN_PASSWORD</b> trên máy chủ.
          </div>
        )}
        <a className="admin-back-link" href="/">
          ← Quay lại gian hàng
        </a>
      </section>
    </main>
  );
}

