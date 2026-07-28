import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
} from "../chatgpt-auth";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getChatGPTUser();
  return (
    <>
      <SiteHeader />
      <main className="auth-page">
        <section className="auth-art">
          <div className="auth-orbit"><span>L</span></div>
          <p className="eyebrow">THÀNH VIÊN LOPA</p>
          <h1>Một tài khoản thật cho mọi hoạt động mua sắm.</h1>
          <p>
            Đơn hàng, thông báo, địa chỉ, đổi trả và quyền người bán được đồng
            bộ an toàn trên máy chủ.
          </p>
          <div>
            <span>✓ Đổi trả 15 ngày</span>
            <span>✓ Theo dõi vận chuyển</span>
            <span>✓ Phân quyền bảo mật</span>
          </div>
        </section>
        <section className="auth-form auth-real-login">
          <p className="eyebrow">
            {user ? "ĐÃ XÁC THỰC" : "ĐĂNG NHẬP AN TOÀN"}
          </p>
          <h2>{user ? `Xin chào, ${user.displayName}` : "Đăng nhập LOPA"}</h2>
          {user ? (
            <>
              <p>
                Bạn đang đăng nhập bằng <b>{user.email}</b>. Hồ sơ D1 sẽ được
                tạo hoặc đồng bộ khi mở tài khoản.
              </p>
              <a className="auth-primary-link" href="/account">
                Mở tài khoản của tôi →
              </a>
              <a
                className="auth-secondary-link"
                href={chatGPTSignOutPath("/")}
              >
                Đăng xuất
              </a>
            </>
          ) : (
            <>
              <p>
                LOPA dùng danh tính được nền tảng xác thực. Website không nhận
                hoặc lưu mật khẩu của bạn.
              </p>
              <a
                className="auth-primary-link"
                href={chatGPTSignInPath("/account")}
              >
                Đăng nhập với ChatGPT →
              </a>
              <div className="auth-security-list">
                <span>Không lưu mật khẩu trong website</span>
                <span>Vai trò customer, seller và admin được kiểm tra phía máy chủ</span>
                <span>Phiên đăng nhập do nền tảng quản lý</span>
              </div>
            </>
          )}
          <small>
            Bằng việc tiếp tục, bạn đồng ý với{" "}
            <a href="/policies/terms">Điều khoản</a> và{" "}
            <a href="/policies/privacy">Chính sách bảo mật</a>.
          </small>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
