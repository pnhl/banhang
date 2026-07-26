import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommerceTracker } from "../../components/CommerceTracker";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { formatPrice, products } from "../../lib/catalog";
import { getSellerForProduct } from "../../lib/marketplace";
import {
  categories,
  getCategoryBySlug,
  SITE_URL,
} from "../../lib/seo";

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.title,
    description: category.description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title: category.title,
      description: category.description,
      url: `/category/${category.slug}`,
      type: "website",
      images: ["/og-marketplace.png"],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();
  const items = products.filter(
    (product) => product.category === category.name,
  );
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category.title,
    numberOfItems: items.length,
    itemListElement: items.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/product/${product.id}`,
      name: product.name,
    })),
  };

  return (
    <>
      <SiteHeader />
      <CommerceTracker
        name="view_item_list"
        params={{
          item_list_id: category.slug,
          item_list_name: category.name,
          items: items.map((product) => ({
            item_id: String(product.id),
            item_name: product.name,
            price: product.price,
          })),
        }}
      />
      <main className="catalog-landing">
        <section
          className="catalog-hero"
          style={{ "--catalog-accent": category.accent } as React.CSSProperties}
        >
          <div className="wrap">
            <div>
              <p className="eyebrow">DANH MỤC NOVA</p>
              <h1>{category.title}</h1>
              <p>{category.description}</p>
            </div>
            <span>{String(items.length).padStart(2, "0")}</span>
          </div>
        </section>
        <section className="market-product-section wrap">
          <header>
            <div>
              <p className="eyebrow">SẢN PHẨM ĐỀ XUẤT</p>
              <h2>{category.name}</h2>
            </div>
            <a href="/#products">Mở bộ lọc nâng cao →</a>
          </header>
          <div className="market-product-grid">
            {items.map((product) => {
              const seller = getSellerForProduct(product.id);
              return (
                <article key={product.id}>
                  <a href={`/product/${product.id}`}>
                    <img src={product.image} alt={product.name} />
                  </a>
                  <p>{product.category}</p>
                  <a href={`/product/${product.id}`}>{product.name}</a>
                  <small>
                    Bởi{" "}
                    <a href={`/store/${seller.slug}`}>{seller.name}</a>
                  </small>
                  <div>
                    <strong>{formatPrice(product.price)}</strong>
                    <span>★ {product.rating}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemList).replace(/</g, "\\u003c"),
        }}
      />
      <SiteFooter />
    </>
  );
}
