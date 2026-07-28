import type { MetadataRoute } from "next";
import { products } from "./lib/catalog";
import { sellers } from "./lib/marketplace";
import { categories, SITE_URL } from "./lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const updatedAt = new Date("2026-07-29T00:00:00+07:00");
  return [
    {
      url: SITE_URL,
      lastModified: updatedAt,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/stores`,
      lastModified: updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...["search", "support", "compare"].map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    })),
    ...categories.map((category) => ({
      url: `${SITE_URL}/category/${category.slug}`,
      lastModified: updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.85,
    })),
    ...products.map((product) => ({
      url: `${SITE_URL}/product/${product.id}`,
      lastModified: updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...sellers.map((seller) => ({
      url: `${SITE_URL}/store/${seller.slug}`,
      lastModified: updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...["shipping", "returns", "privacy", "terms"].map((slug) => ({
      url: `${SITE_URL}/policies/${slug}`,
      lastModified: updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
