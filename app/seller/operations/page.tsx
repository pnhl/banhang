import { getCurrentAppUser, hasLegacyAdminSession } from "../../lib/platform-server";
import { SellerOperations } from "./SellerOperations";

export const dynamic = "force-dynamic";

export default async function SellerOperationsPage() {
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
          <h1>Bạn chưa có quyền vận hành gian hàng.</h1>
          <a href="/seller">Kiểm tra quyền Seller Center →</a>
        </section>
      </main>
    );
  }
  return <SellerOperations />;
}
