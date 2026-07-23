import { notFound } from "next/navigation";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { products } from "../../lib/catalog";
import { ProductDetailClient } from "./ProductDetailClient";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products.find((item) => item.id === Number(id));
  if (!product) notFound();

  return <><SiteHeader /><ProductDetailClient product={product} /><SiteFooter /></>;
}
