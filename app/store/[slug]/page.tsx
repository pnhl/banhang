import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommerceTracker } from "../../components/CommerceTracker";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { formatPrice, products } from "../../lib/catalog";
import {
  getProductsForSeller,
  getSellerBySlug,
  sellers,
} from "../../lib/marketplace";
import { SITE_URL } from "../../lib/seo";

export function generateStaticParams() {
  return sellers.flatMap((seller) => [
    { slug: seller.slug },
    ...(seller.aliases ?? []).map((slug) => ({ slug })),
  ]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const seller = getSellerBySlug(slug);
  if (!seller) return {};
  return {
    title: `${seller.name} — Gian hàng chính hãng`,
    description: seller.description,
    alternates: { canonical: `/store/${seller.slug}` },
    openGraph: {
      title: seller.name,
      description: seller.tagline,
      url: `/store/${seller.slug}`,
      images: ["/og.png"],
    },
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const seller = getSellerBySlug(slug);
  if (!seller) notFound();
  const items = getProductsForSeller(seller.id, products);
  const schema = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: seller.name,
    url: `${SITE_URL}/store/${seller.slug}`,
    description: seller.description,
    email: seller.supportEmail,
    areaServed: "VN",
  };

  return (
    <>
      <SiteHeader />
      <CommerceTracker
        name="view_store"
        params={{
          seller_id: seller.id,
          seller_name: seller.name,
          item_count: items.length,
        }}
      />
      <main className="store-page">
        <section
          className="store-hero"
          style={{ "--store-accent": seller.accent } as React.CSSProperties}
        >
          <div className="wrap">
            <div className="store-avatar large">{seller.shortName}</div>
            <div>
              <p className="eyebrow">GIAN HÀNG ĐÃ XÁC MINH</p>
              <h1>{seller.name}</h1>
              <p>{seller.description}</p>
              <div>
                <span>★ {seller.rating}</span>
                <span>{seller.followers} người theo dõi</span>
                <span>Phản hồi {seller.responseRate}%</span>
                <span>Tham gia {seller.joinedYear}</span>
              </div>
            </div>
          </div>
        </section>
        <section className="market-product-section wrap">
          <header>
            <div>
              <p className="eyebrow">DANH MỤC GIAN HÀNG</p>
              <h2>{items.length} sản phẩm đang bán</h2>
            </div>
            <span>Gửi từ {seller.location}</span>
          </header>
          <div className="market-product-grid">
            {items.map((product) => (
              <article key={product.id}>
                <a href={`/product/${product.id}`}>
                  <img src={product.image} alt={product.name} />
                </a>
                <p>{product.category}</p>
                <a href={`/product/${product.id}`}>{product.name}</a>
                <small>Đã bán {product.sold}</small>
                <div>
                  <strong>{formatPrice(product.price)}</strong>
                  <span>★ {product.rating}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
      <SiteFooter />
    </>
  );
}
