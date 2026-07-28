import { chatGPTSignInPath, getChatGPTUser } from "../chatgpt-auth";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getChatGPTUser();
  return (
    <>
      <SiteHeader />
      <main className="auth-page register-page">
        <section className="auth-art">
          <div className="auth-orbit"><span>✦</span></div>
          <p className="eyebrow">GIA NHẬP LOPA</p>
          <h1>Tạo hồ sơ thành viên mà không cần thêm một mật khẩu mới.</h1>
          <p>
            Sau lần đăng nhập đầu tiên, LOPA tự tạo hồ sơ D1 và gán quyền khách
            hàng. Bạn có thể nộp hồ sơ mở gian hàng bất cứ lúc nào.
          </p>
          <div>
            <span>Hồ sơ đồng bộ D1</span>
            <span>Đăng ký Seller Center</span>
          </div>
        </section>
        <section className="auth-form auth-real-login">
          <p className="eyebrow">TẠO TÀI KHOẢN</p>
          <h2>{user ? "Hồ sơ đã sẵn sàng" : "Đăng ký thành viên"}</h2>
          <p>
            {user
              ? `Danh tính ${user.email} đã được xác thực.`
              : "Tài khoản khách hàng được tạo tự động trong D1 sau khi xác thực thành công."}
          </p>
          <a
            className="auth-primary-link"
            href={user ? "/account" : chatGPTSignInPath("/account")}
          >
            {user ? "Mở hồ sơ của tôi →" : "Xác thực và tạo tài khoản →"}
          </a>
          <div className="auth-security-list">
            <span>Email được xác minh bởi nền tảng</span>
            <span>Địa chỉ và số điện thoại chỉ lưu khi bạn chủ động nhập</span>
            <span>Lịch sử quyền được ghi vào nhật ký bảo mật</span>
          </div>
          <small>
            LOPA không có biểu mẫu mật khẩu riêng và không gửi mật khẩu vào D1.
          </small>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
