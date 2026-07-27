"use client";

import { FormEvent, useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

const faqs = [
  {
    question: "Làm sao theo dõi đơn hàng?",
    answer:
      "Mở Tài khoản, chọn đơn cần xem rồi nhấn “Chi tiết”. Tiến trình xác nhận, đóng gói, giao hàng và hoàn tất sẽ hiển thị tại đó.",
  },
  {
    question: "Tôi có thể hủy đơn sau khi đặt không?",
    answer:
      "Bạn có thể hủy khi đơn còn ở trạng thái Chờ xác nhận. Khi đơn đã đóng gói hoặc giao cho đơn vị vận chuyển, hãy liên hệ hỗ trợ.",
  },
  {
    question: "LOPA hỗ trợ những phương thức thanh toán nào?",
    answer:
      "Bản demo mô phỏng ví điện tử, thẻ ngân hàng, chuyển khoản và thanh toán khi nhận hàng. Website không thu thập dữ liệu tài chính thật.",
  },
  {
    question: "Chính sách đổi trả áp dụng thế nào?",
    answer:
      "Sản phẩm đủ điều kiện có thể được yêu cầu đổi trả trong 15 ngày. Xem trang Chính sách đổi trả để biết tình trạng hàng và hồ sơ cần chuẩn bị.",
  },
];

export default function SupportPage() {
  const [sent, setSent] = useState(false);

  const lookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = String(form.get("orderId") ?? "")
      .trim()
      .replace(/^#/, "");
    if (id) window.location.href = `/orders/${encodeURIComponent(id)}`;
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  };

  return (
    <>
      <SiteHeader />
      <main className="support-page">
        <header>
          <div className="wrap">
            <p className="eyebrow">LOPA CARE</p>
            <h1>Chúng tôi có thể giúp gì cho bạn?</h1>
            <p>Tra cứu đơn, tìm câu trả lời hoặc gửi yêu cầu hỗ trợ trong vài phút.</p>
            <form onSubmit={lookup}>
              <span>⌕</span>
              <input required name="orderId" placeholder="Nhập mã đơn, ví dụ LP2607241234" aria-label="Mã đơn hàng" />
              <button>Tra cứu đơn</button>
            </form>
          </div>
        </header>

        <section className="support-shortcuts wrap">
          <a href="/account"><span>▤</span><b>Đơn hàng của tôi</b><small>Xem trạng thái và mua lại</small></a>
          <a href="/policies/shipping"><span>⚡</span><b>Giao hàng</b><small>Thời gian và phạm vi giao</small></a>
          <a href="/policies/returns"><span>↺</span><b>Đổi trả</b><small>Điều kiện trong 15 ngày</small></a>
          <a href="/policies/privacy"><span>♢</span><b>Bảo mật</b><small>Cách LOPA bảo vệ dữ liệu</small></a>
        </section>

        <div className="support-grid wrap">
          <section className="support-faq">
            <p className="eyebrow">CÂU HỎI THƯỜNG GẶP</p>
            <h2>Câu trả lời nhanh</h2>
            <div>
              {faqs.map((faq, index) => (
                <details key={faq.question} open={index === 0}>
                  <summary>{faq.question}<span>＋</span></summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="support-contact">
            <p className="eyebrow">GỬI YÊU CẦU</p>
            <h2>Liên hệ LOPA Care</h2>
            <p>Đội ngũ hỗ trợ demo phản hồi trong giờ làm việc 08:00–22:00.</p>
            <form onSubmit={submit}>
              <label>Họ và tên<input required name="name" placeholder="Nguyễn Minh Anh" /></label>
              <label>Email<input required type="email" name="email" placeholder="hello@example.com" /></label>
              <label>Chủ đề
                <select name="topic" defaultValue="Đơn hàng">
                  <option>Đơn hàng</option>
                  <option>Thanh toán</option>
                  <option>Đổi trả</option>
                  <option>Sản phẩm</option>
                  <option>Khác</option>
                </select>
              </label>
              <label>Nội dung<textarea required name="message" placeholder="Mô tả vấn đề bạn cần hỗ trợ..." /></label>
              <button>Gửi yêu cầu</button>
            </form>
            {sent && <div className="form-success">✓ Yêu cầu demo đã được ghi nhận trên trang này.</div>}
            <small>Biểu mẫu demo không gửi dữ liệu ra ngoài trình duyệt.</small>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
