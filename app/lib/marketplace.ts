import type { CartLine, Product } from "./catalog";

export type Seller = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  location: string;
  rating: number;
  followers: string;
  joinedYear: number;
  responseRate: number;
  commissionRate: number;
  accent: string;
  verified: boolean;
  taxCode: string;
  supportEmail: string;
  productIds: number[];
};

export type SellerAllocation = {
  sellerId: string;
  sellerName: string;
  gross: number;
  discount: number;
  commission: number;
  tax: number;
  net: number;
  itemCount: number;
};

export const sellers: Seller[] = [
  {
    id: "nova-digital",
    slug: "nova-digital",
    name: "NOVA Digital",
    shortName: "ND",
    tagline: "Công nghệ chọn lọc, bảo hành rõ ràng",
    description:
      "Gian hàng điện tử và thiết bị sáng tạo được NOVA xác minh, tập trung vào sản phẩm có trải nghiệm sử dụng tốt và hậu mãi minh bạch.",
    location: "TP. Hồ Chí Minh",
    rating: 4.9,
    followers: "18,6k",
    joinedYear: 2022,
    responseRate: 98,
    commissionRate: 0.055,
    accent: "#173f35",
    verified: true,
    taxCode: "MST-DEMO-ND01",
    supportEmail: "digital@novamarket.vn",
    productIds: [1, 4, 8, 9],
  },
  {
    id: "cloud-lifestyle",
    slug: "cloud-lifestyle",
    name: "Cloud Lifestyle",
    shortName: "CL",
    tagline: "Phong cách nhẹ nhàng cho nhịp sống thành thị",
    description:
      "Tuyển chọn thời trang và phụ kiện hằng ngày với thiết kế tối giản, nguồn gốc rõ ràng và chính sách đổi trả thân thiện.",
    location: "Hà Nội",
    rating: 4.8,
    followers: "12,4k",
    joinedYear: 2023,
    responseRate: 96,
    commissionRate: 0.07,
    accent: "#d95f45",
    verified: true,
    taxCode: "MST-DEMO-CL02",
    supportEmail: "cloud@novamarket.vn",
    productIds: [2, 3, 7],
  },
  {
    id: "nest-and-dew",
    slug: "nest-and-dew",
    name: "Nest & Dew",
    shortName: "N&D",
    tagline: "Chăm sóc bản thân và tổ ấm theo cách tinh gọn",
    description:
      "Gian hàng nhà cửa và làm đẹp theo định hướng sống lành mạnh, ưu tiên vật liệu dễ chăm sóc và công thức minh bạch.",
    location: "Đà Nẵng",
    rating: 4.7,
    followers: "9,8k",
    joinedYear: 2024,
    responseRate: 95,
    commissionRate: 0.08,
    accent: "#879b78",
    verified: true,
    taxCode: "MST-DEMO-ND03",
    supportEmail: "nest@novamarket.vn",
    productIds: [5, 6, 10],
  },
];

export const getSellerById = (id?: string) =>
  sellers.find((seller) => seller.id === id) ?? sellers[0];

export const getSellerBySlug = (slug: string) =>
  sellers.find((seller) => seller.slug === slug);

export const getSellerForProduct = (productId: number) =>
  sellers.find((seller) => seller.productIds.includes(productId)) ?? sellers[0];

export const getProductsForSeller = (
  sellerId: string,
  catalog: Product[],
) => {
  const seller = getSellerById(sellerId);
  return catalog.filter((product) => seller.productIds.includes(product.id));
};

export function getSellerSubtotals(items: CartLine[]) {
  return items.reduce<Record<string, number>>((totals, item) => {
    const seller = getSellerForProduct(item.id);
    totals[seller.id] =
      (totals[seller.id] ?? 0) + item.price * item.quantity;
    return totals;
  }, {});
}

export function allocateOrderBySeller(
  items: CartLine[],
  discount: number,
  tax: number,
): SellerAllocation[] {
  const grossTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const grouped = new Map<
    string,
    { seller: Seller; gross: number; itemCount: number }
  >();

  for (const item of items) {
    const seller = getSellerForProduct(item.id);
    const current = grouped.get(seller.id) ?? {
      seller,
      gross: 0,
      itemCount: 0,
    };
    current.gross += item.price * item.quantity;
    current.itemCount += item.quantity;
    grouped.set(seller.id, current);
  }

  return Array.from(grouped.values()).map(({ seller, gross, itemCount }) => {
    const share = grossTotal > 0 ? gross / grossTotal : 0;
    const sellerDiscount = Math.round(discount * share);
    const sellerTax = Math.round(tax * share);
    const commission = Math.round(
      Math.max(0, gross - sellerDiscount) * seller.commissionRate,
    );
    return {
      sellerId: seller.id,
      sellerName: seller.name,
      gross,
      discount: sellerDiscount,
      commission,
      tax: sellerTax,
      net: Math.max(0, gross - sellerDiscount - commission),
      itemCount,
    };
  });
}

export const MARKETPLACE_COMMERCE_UPDATED_EVENT =
  "nova-marketplace-commerce-updated";
