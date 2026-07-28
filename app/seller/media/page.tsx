import { getCurrentAppUser, hasLegacyAdminSession } from "../../lib/platform-server";
import { MediaManager } from "./MediaManager";

export const dynamic = "force-dynamic";

export default async function SellerMediaPage() {
  const user = await getCurrentAppUser();
  if (
    !(
      user?.status === "active" &&
      (user.role === "seller" || user.role === "admin")
    ) &&
    !(await hasLegacyAdminSession())
  ) {
    return (
      <main className="seller-access-page">
        <section>
          <h1>Bạn chưa có quyền quản lý hình ảnh.</h1>
          <a href="/seller">Kiểm tra quyền Seller Center →</a>
        </section>
      </main>
    );
  }
  return <MediaManager />;
}
