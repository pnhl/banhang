import { chatGPTSignInPath } from "../../chatgpt-auth";
import { getCurrentAppUser } from "../../lib/platform-server";
import { SellerOnboarding } from "./SellerOnboarding";

export const dynamic = "force-dynamic";

export default async function SellerOnboardingPage() {
  const user = await getCurrentAppUser();
  if (!user) {
    return (
      <main className="seller-access-page">
        <section>
          <span className="brand-mark">L</span>
          <p className="eyebrow">SELLER ONBOARDING</p>
          <h1>Đăng nhập trước khi gửi hồ sơ.</h1>
          <a href={chatGPTSignInPath("/seller/onboarding")}>
            Đăng nhập và tiếp tục →
          </a>
        </section>
      </main>
    );
  }
  return <SellerOnboarding />;
}
