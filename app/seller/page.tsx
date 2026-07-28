import { AdminLogin } from "../admin/AdminLogin";
import { getAdminPassword } from "../lib/admin-auth";
import {
  getCurrentAppUser,
  hasLegacyAdminSession,
} from "../lib/platform-server";
import { SellerCenter } from "./SellerCenter";

export const dynamic = "force-dynamic";

export default async function SellerPage() {
  const user = await getCurrentAppUser();
  if (
    (user?.status === "active" &&
      (user.role === "seller" || user.role === "admin")) ||
    (await hasLegacyAdminSession())
  ) {
    return <SellerCenter />;
  }
  if (user) {
    return (
      <main className="seller-access-page">
        <section>
          <span className="brand-mark">L</span>
          <p className="eyebrow">MỞ GIAN HÀNG LOPA</p>
          <h1>Tài khoản của bạn chưa có quyền người bán.</h1>
          <p>
            Gửi hồ sơ doanh nghiệp để quản trị viên xét duyệt. Sau khi được
            duyệt, vai trò seller sẽ được lưu trong D1.
          </p>
          <div>
            <a href="/seller/onboarding">Nộp hồ sơ người bán →</a>
            <a href="/">Về trang mua sắm</a>
          </div>
        </section>
      </main>
    );
  }
  return <AdminLogin configured={Boolean(await getAdminPassword())} />;
}
