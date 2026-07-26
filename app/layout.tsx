import type { Metadata } from "next";
import { headers } from "next/headers";
import { Be_Vietnam_Pro, Lora } from "next/font/google";
import { AnalyticsConsent } from "./components/AnalyticsConsent";
import { GoogleAnalytics } from "./components/GoogleAnalytics";
import { getGoogleAnalyticsId } from "./lib/analytics-server";
import { SITE_URL } from "./lib/seo";
import "./globals.css";

const bodyFont = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

const displayFont = Lora({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    applicationName: "NOVA Market",
    title: {
      default: "NOVA Market — Món hay mỗi ngày",
      template: "%s | NOVA Market",
    },
    description:
      "Sàn mua sắm hiện đại với sản phẩm chọn lọc, giá tốt và giao hàng nhanh.",
    keywords: [
      "NOVA Market",
      "mua sắm trực tuyến",
      "sàn thương mại điện tử",
      "gian hàng chính hãng",
      "mua hàng online Việt Nam",
    ],
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
    openGraph: {
      title: "NOVA Market — Món hay mỗi ngày",
      description: "Chọn hàng chất, săn ưu đãi thật và nhận tận tay nhanh hơn.",
      type: "website",
      locale: "vi_VN",
      siteName: "NOVA Market",
      url: "/",
      images: [
        {
          url: "/og-marketplace.png",
          width: 1672,
          height: 941,
          alt: "NOVA Market — Mỗi gian hàng, một chuyên môn",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "NOVA Market — Món hay mỗi ngày",
      description: "Chọn hàng chất, săn ưu đãi thật và nhận tận tay nhanh hơn.",
      images: ["/og-marketplace.png"],
    },
    icons: { icon: "/favicon.svg" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analyticsId = await getGoogleAnalyticsId();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "NOVA Market",
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.svg`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "NOVA Market",
        inLanguage: "vi-VN",
        publisher: { "@id": `${SITE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/?q={search_term_string}#products`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
  return (
    <html lang="vi">
      <head>
        <GoogleAnalytics measurementId={analyticsId} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        {children}
        <AnalyticsConsent enabled={Boolean(analyticsId)} />
      </body>
    </html>
  );
}
