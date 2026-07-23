import type { Metadata } from "next";
import { headers } from "next/headers";
import { Be_Vietnam_Pro, Lora } from "next/font/google";
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
    title: "NOVA Market — Món hay mỗi ngày",
    description:
      "Sàn mua sắm hiện đại với sản phẩm chọn lọc, giá tốt và giao hàng nhanh.",
    openGraph: {
      title: "NOVA Market — Món hay mỗi ngày",
      description: "Chọn hàng chất, săn ưu đãi thật và nhận tận tay nhanh hơn.",
      type: "website",
      images: [{ url: "/og.png", width: 1536, height: 864, alt: "NOVA Market" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "NOVA Market — Món hay mỗi ngày",
      description: "Chọn hàng chất, săn ưu đãi thật và nhận tận tay nhanh hơn.",
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
