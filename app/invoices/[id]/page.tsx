import type { Metadata } from "next";
import { InvoiceClient } from "./InvoiceClient";

export const metadata: Metadata = {
  title: "Hóa đơn điện tử",
  robots: { index: false, follow: false },
};

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InvoiceClient orderId={id} />;
}
