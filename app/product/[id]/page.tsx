import type { Metadata } from "next";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { products, type Product } from "../../lib/catalog";
import { getSellerForProduct } from "../../lib/marketplace";
import { listCatalog, requireDatabase } from "../../lib/platform-server";
import { SITE_URL } from "../../lib/seo";
import { ProductDetailResolver } from "./ProductDetailClient";

export function generateStaticParams() {
  return products.map((product) => ({ id: String(product.id) }));
}

async function resolveProduct(id: number): Promise<Product | undefined> {
  try {
    const row = (await listCatalog(await requireDatabase())).find(
      (item) => Number(item.id) === id && item.status === "active",
    );
    if (row) {
      return {
        id: Number(row.id),
        name: row.name,
        category: row.category,
        price: Number(row.price),
        oldPrice: Number(row.old_price),
        rating: Number(row.rating),
        sold: String(row.sold_count),
        delivery: Number(row.delivery_days),
        image: row.image_url,
        badge: row.badge ?? undefined,
        description: row.description,
      };
    }
  } catch {
    // Static catalog remains available during local builds without D1.
  }
  return products.find((item) => item.id === id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await resolveProduct(Number(id));
  if (!product) {
    return {
      title: "Sản phẩm không còn hiển thị",
      robots: { index: false, follow: true },
    };
  }
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/product/${product.id}` },
    openGraph: {
      title: product.name,
      description: product.description,
      type: "website",
      url: `/product/${product.id}`,
      images: [{ url: product.image, alt: product.name }],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await resolveProduct(Number(id));
  const seller = product ? getSellerForProduct(product.id) : null;
  const schema =
    product && seller
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          image: [product.image],
          description: product.description,
          sku: `LOPA-${String(product.id).padStart(4, "0")}`,
          brand: { "@type": "Brand", name: seller.name },
          offers: {
            "@type": "Offer",
            url: `${SITE_URL}/product/${product.id}`,
            priceCurrency: "VND",
            price: product.price,
            priceValidUntil: "2026-12-31",
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: {
              "@type": "Organization",
              name: seller.name,
              url: `${SITE_URL}/store/${seller.slug}`,
            },
          },
        }
      : null;

  return (
    <>
      <SiteHeader />
      <ProductDetailResolver
        productId={Number(id)}
        initialProduct={product}
      />
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <SiteFooter />
    </>
  );
}
