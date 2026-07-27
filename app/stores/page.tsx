import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { products } from "../lib/catalog";
import { sellers } from "../lib/marketplace";

export const metadata: Metadata = {
  title: "Gian hàng chính hãng",
  description:
    "Khám phá các nhà bán hàng đã xác minh, chính sách rõ ràng và danh mục được tuyển chọn trên LOPA MARKET.",
  alternates: { canonical: "/stores" },
};

export default function StoresPage() {
  return (
    <>
      <SiteHeader />
      <main className="stores-page wrap">
        <header>
          <p className="eyebrow">LOPA MARKETPLACE</p>
          <h1>Mỗi gian hàng, một chuyên môn.</h1>
          <p>
            Khám phá các nhà bán hàng đã xác minh, theo dõi uy tín và mua sản
            phẩm theo chính sách minh bạch.
          </p>
        </header>
        <section className="store-directory">
          {sellers.map((seller) => (
            <article
              key={seller.id}
              style={{ "--store-accent": seller.accent } as React.CSSProperties}
            >
              <div className="store-avatar">{seller.shortName}</div>
              <div>
                <p>
                  <b>{seller.name}</b>
                  {seller.verified && <span>✓ Đã xác minh</span>}
                </p>
                <h2>{seller.tagline}</h2>
                <small>
                  ★ {seller.rating} · {seller.followers} người theo dõi ·{" "}
                  {products.filter((product) =>
                    seller.productIds.includes(product.id),
                  ).length}{" "}
                  sản phẩm
                </small>
              </div>
              <a href={`/store/${seller.slug}`}>Xem gian hàng →</a>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
