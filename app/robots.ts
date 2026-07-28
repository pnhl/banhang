import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/product/", "/category/", "/stores", "/store/"],
      disallow: [
        "/admin",
        "/seller",
        "/checkout",
        "/cart",
        "/account",
        "/notifications",
        "/orders/",
        "/api/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
