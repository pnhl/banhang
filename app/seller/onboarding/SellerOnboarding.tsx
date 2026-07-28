"use client";

import { type FormEvent, useEffect, useState } from "react";

type Application = {
  status: string;
  shop_name: string;
  reviewer_note: string | null;
};

export function SellerOnboarding() {
  const [application, setApplication] = useState<Application | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch("/api/seller/application", { cache: "no-store" })
      .then(
        async (response) =>
          (await response.json()) as { applications?: Application[] },
      )
      .then((result) =>
        setApplication(result.applications?.[0] ?? null),
      );
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/seller/application", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        shopName: form.get("shopName"),
        businessType: form.get("businessType"),
        taxCode: form.get("taxCode"),
        phone: form.get("phone"),
        description: form.get("description"),
      }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    if (response.ok) {
      setMessage("Đã gửi hồ sơ. Quản trị viên sẽ phản hồi trong thông báo.");
      setApplication({
        status: "submitted",
        shop_name: String(form.get("shopName") ?? ""),
        reviewer_note: null,
      });
    } else {
      setMessage(result.message ?? "Chưa thể gửi hồ sơ.");
    }
    setLoading(false);
  };

  return (
    <main className="seller-onboarding-page">
      <section className="seller-onboarding-intro">
        <a className="brand" href="/">
          <span className="brand-mark">L</span>
          <span>LOPA<span>seller</span></span>
        </a>
        <p className="eyebrow">SELLER ONBOARDING</p>
        <h1>Biến chuyên môn của bạn thành một gian hàng đáng tin cậy.</h1>
        <p>
          Hồ sơ được lưu trong D1, xét duyệt có nhật ký và quyền seller chỉ được
          cấp phía máy chủ.
        </p>
        <ol>
          <li><b>1</b><span>Gửi thông tin cửa hàng</span></li>
          <li><b>2</b><span>LOPA xác minh hồ sơ</span></li>
          <li><b>3</b><span>Nhận quyền Seller Center</span></li>
        </ol>
      </section>
      <form className="seller-onboarding-form" onSubmit={submit}>
        <p className="eyebrow">HỒ SƠ NGƯỜI BÁN</p>
        <h2>Đăng ký mở gian hàng</h2>
        {application && (
          <div className={`application-status ${application.status}`}>
            <b>Trạng thái: {application.status}</b>
            <span>
              {application.shop_name}
              {application.reviewer_note
                ? ` · ${application.reviewer_note}`
                : ""}
            </span>
          </div>
        )}
        <label>
          Tên gian hàng
          <input required name="shopName" defaultValue={application?.shop_name ?? ""} />
        </label>
        <div className="two-col">
          <label>
            Loại hình
            <select required name="businessType">
              <option value="Hộ kinh doanh">Hộ kinh doanh</option>
              <option value="Doanh nghiệp">Doanh nghiệp</option>
              <option value="Cá nhân">Cá nhân</option>
            </select>
          </label>
          <label>
            Số điện thoại
            <input required name="phone" />
          </label>
        </div>
        <label>
          Mã số thuế (nếu có)
          <input name="taxCode" />
        </label>
        <label>
          Mô tả sản phẩm và năng lực vận hành
          <textarea required minLength={30} name="description" />
        </label>
        <button disabled={loading}>
          {loading ? "Đang gửi…" : "Gửi hồ sơ xét duyệt →"}
        </button>
        {message && <div className="form-success">{message}</div>}
      </form>
    </main>
  );
}
