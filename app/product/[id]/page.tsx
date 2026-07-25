import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { products } from "../../lib/catalog";
import { ProductDetailResolver } from "./ProductDetailClient";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products.find((item) => item.id === Number(id));

  return (
    <>
      <SiteHeader />
      <ProductDetailResolver
        productId={Number(id)}
        initialProduct={product}
      />
      <SiteFooter />
    </>
  );
}
