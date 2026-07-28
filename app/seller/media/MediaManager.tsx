"use client";

import { type FormEvent, useEffect, useState } from "react";

type MediaAsset = {
  id: string;
  filename: string;
  content_type: string;
  byte_size: number;
  alt_text: string | null;
  created_at: string;
  url: string;
};

export function MediaManager() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");

  const load = async () => {
    const response = await fetch("/api/media", { cache: "no-store" });
    const result = (await response.json()) as {
      assets?: MediaAsset[];
      message?: string;
    };
    setAssets(result.assets ?? []);
    setMessage(response.ok ? "" : result.message ?? "Không tải được thư viện.");
    setLoading(false);
  };

  useEffect(() => {
    setOrigin(window.location.origin);
    void load();
  }, []);

  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/media", {
      method: "POST",
      body: new FormData(event.currentTarget),
    });
    const result = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    setMessage(
      response.ok ? "Ảnh đã được lưu vào R2." : result.message ?? "Tải ảnh thất bại.",
    );
    if (response.ok) event.currentTarget.reset();
    await load();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Xóa ảnh này khỏi thư viện R2?")) return;
    const response = await fetch(`/api/media/${id}`, { method: "DELETE" });
    const result = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    setMessage(response.ok ? "Đã xóa ảnh." : result.message ?? "Không thể xóa.");
    await load();
  };

  return (
    <main className="seller-tool-page">
      <header className="seller-tool-header">
        <a className="brand" href="/seller">
          <span className="brand-mark">L</span>
          <span>LOPA<span>media</span></span>
        </a>
        <nav>
          <a href="/seller/operations">Vận hành</a>
          <a href="/seller">Seller Center</a>
        </nav>
      </header>
      <section className="seller-tool-shell">
        <div className="seller-tool-title">
          <div>
            <p className="eyebrow">R2 MEDIA LIBRARY</p>
            <h1>Quản lý hình ảnh</h1>
            <p>Ảnh thật lưu trong R2; metadata và quyền sở hữu lưu trong D1.</p>
          </div>
          <span>{assets.length} tệp</span>
        </div>
        <form className="media-upload-form" onSubmit={upload}>
          <label>
            Chọn ảnh
            <input
              required
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
            />
          </label>
          <label>
            Văn bản thay thế
            <input name="altText" placeholder="Mô tả ảnh cho SEO và trợ năng" />
          </label>
          <button disabled={loading}>
            {loading ? "Đang xử lý…" : "Tải lên R2 →"}
          </button>
          <small>JPG, PNG, WebP hoặc AVIF · tối đa 5 MB.</small>
        </form>
        {message && <div className="platform-notice">{message}</div>}
        <section className="media-grid">
          {assets.map((asset) => (
            <article key={asset.id}>
              <img src={asset.url} alt={asset.alt_text ?? asset.filename} />
              <div>
                <b>{asset.filename}</b>
                <small>
                  {(asset.byte_size / 1024).toFixed(1)} KB · {asset.content_type}
                </small>
              </div>
              <input readOnly value={`${origin}${asset.url}`} />
              <button onClick={() => remove(asset.id)}>Xóa</button>
            </article>
          ))}
          {!loading && assets.length === 0 && (
            <div className="platform-empty">
              <span>▧</span>
              <h2>Thư viện chưa có ảnh</h2>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
