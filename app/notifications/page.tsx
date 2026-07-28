"use client";

import { useEffect, useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

type Notice = {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const load = async () => {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (response.status === 401) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }
    const result = (await response.json()) as { notifications?: Notice[] };
    setItems(result.notifications ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const markAll = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    await load();
    window.dispatchEvent(new Event("lopa-notifications-updated"));
  };

  return (
    <>
      <SiteHeader />
      <main className="notifications-page wrap">
        <header>
          <div>
            <p className="eyebrow">TRUNG TÂM THÔNG BÁO</p>
            <h1>Cập nhật quan trọng</h1>
            <p>Thanh toán, vận chuyển, đổi trả và quyền tài khoản.</p>
          </div>
          {items.some((item) => !item.read_at) && (
            <button onClick={markAll}>Đánh dấu đã đọc</button>
          )}
        </header>
        {loading ? (
          <div className="platform-loading">Đang tải thông báo…</div>
        ) : unauthorized ? (
          <section className="platform-empty">
            <span>♙</span>
            <h2>Đăng nhập để xem thông báo</h2>
            <a href="/login">Đăng nhập an toàn →</a>
          </section>
        ) : items.length === 0 ? (
          <section className="platform-empty">
            <span>✓</span>
            <h2>Bạn đã xem hết mọi cập nhật</h2>
            <p>Thông báo mới sẽ xuất hiện tại đây.</p>
          </section>
        ) : (
          <section className="notification-list">
            {items.map((item) => (
              <article className={item.read_at ? "" : "unread"} key={item.id}>
                <span>{item.type === "payment" ? "₫" : item.type === "shipping" ? "↗" : "◇"}</span>
                <div>
                  <p>{item.title}</p>
                  <small>{item.message}</small>
                  <time>
                    {new Intl.DateTimeFormat("vi-VN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(item.created_at))}
                  </time>
                </div>
                {item.action_url && <a href={item.action_url}>Xem →</a>}
              </article>
            ))}
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
