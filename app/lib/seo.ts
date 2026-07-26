export const SITE_URL =
  "https://nova-market-vn.longphan805.chatgpt.site";

export type CategoryDefinition = {
  slug: string;
  name: string;
  title: string;
  description: string;
  accent: string;
};

export const categories: CategoryDefinition[] = [
  {
    slug: "dien-tu",
    name: "Điện tử",
    title: "Thiết bị điện tử chọn lọc",
    description:
      "Tai nghe, điện thoại, máy ảnh và phụ kiện công nghệ được chọn theo hiệu năng, thiết kế và chính sách hậu mãi.",
    accent: "#173f35",
  },
  {
    slug: "thoi-trang",
    name: "Thời trang",
    title: "Thời trang cho nhịp sống hiện đại",
    description:
      "Những thiết kế dễ ứng dụng, thoải mái và bền đẹp cho tủ đồ hằng ngày.",
    accent: "#d95f45",
  },
  {
    slug: "phu-kien",
    name: "Phụ kiện",
    title: "Phụ kiện tinh gọn và hữu dụng",
    description:
      "Hoàn thiện phong cách và công việc với những phụ kiện được chọn kỹ về vật liệu và công năng.",
    accent: "#aa7558",
  },
  {
    slug: "nha-cua",
    name: "Nhà cửa",
    title: "Không gian sống dễ chịu hơn",
    description:
      "Nội thất và vật dụng có thiết kế hài hòa, dễ chăm sóc và phù hợp nhiều không gian.",
    accent: "#879b78",
  },
  {
    slug: "lam-dep",
    name: "Làm đẹp",
    title: "Chăm sóc cá nhân minh bạch",
    description:
      "Sản phẩm làm đẹp tập trung vào thành phần rõ ràng và trải nghiệm sử dụng nhẹ nhàng.",
    accent: "#bd846c",
  },
];

export const getCategoryBySlug = (slug: string) =>
  categories.find((category) => category.slug === slug);

export const getCategorySlug = (name: string) =>
  categories.find((category) => category.name === name)?.slug ?? "san-pham";
