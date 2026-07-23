export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice: number;
  rating: number;
  sold: string;
  delivery: number;
  image: string;
  badge?: string;
  description: string;
};

export type CartLine = Product & { quantity: number };

export const products: Product[] = [
  { id: 1, name: "Tai nghe chụp tai NovaSound Air", category: "Điện tử", price: 1290000, oldPrice: 1790000, rating: 4.9, sold: "2,1k", delivery: 2, badge: "BÁN CHẠY", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=88", description: "Chống ồn chủ động, pin 48 giờ và đệm tai memory foam êm ái cho cả ngày dài." },
  { id: 2, name: "Giày sneaker Cloud Walk", category: "Thời trang", price: 689000, oldPrice: 990000, rating: 4.8, sold: "5,8k", delivery: 1, badge: "GIẢM 30%", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=88", description: "Đế foam siêu nhẹ, phom ôm chân và chất liệu thoáng khí dành cho nhịp sống năng động." },
  { id: 3, name: "Đồng hồ tối giản Mono 36", category: "Phụ kiện", price: 849000, oldPrice: 1200000, rating: 4.7, sold: "980", delivery: 3, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=88", description: "Mặt kính sapphire, dây da thật và thiết kế thanh lịch phù hợp mọi phong cách." },
  { id: 4, name: "Máy ảnh compact Pocket C1", category: "Điện tử", price: 3890000, oldPrice: 4590000, rating: 4.9, sold: "438", delivery: 2, badge: "MỚI", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=88", description: "Cảm biến 24MP, quay 4K và kết nối nhanh với điện thoại cho những chuyến đi." },
  { id: 5, name: "Ghế thư giãn Nordic Lounge", category: "Nhà cửa", price: 2190000, oldPrice: 2800000, rating: 4.6, sold: "721", delivery: 4, image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=88", description: "Khung gỗ sồi chắc chắn, đường cong công thái học và đệm vải chống bám bụi." },
  { id: 6, name: "Tinh chất phục hồi Dew Lab", category: "Làm đẹp", price: 459000, oldPrice: 620000, rating: 4.9, sold: "3,4k", delivery: 1, badge: "FREESHIP", image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=88", description: "Công thức 5% niacinamide cùng peptide giúp cấp ẩm và củng cố hàng rào bảo vệ da." },
  { id: 7, name: "Balo laptop Urban Day 16”", category: "Phụ kiện", price: 569000, oldPrice: 790000, rating: 4.8, sold: "1,7k", delivery: 2, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=88", description: "Chống thấm nhẹ, ngăn laptop chống sốc và hệ thống quai đeo phân tán lực." },
  { id: 8, name: "Điện thoại Nova X Lite 5G", category: "Điện tử", price: 6490000, oldPrice: 7290000, rating: 4.7, sold: "860", delivery: 2, badge: "TRẢ GÓP 0%", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa?auto=format&fit=crop&w=1200&q=88", description: "Màn hình OLED 120Hz, camera AI 50MP và kết nối 5G mạnh mẽ." },
  { id: 9, name: "Bàn phím cơ Studio 75", category: "Điện tử", price: 1490000, oldPrice: 1890000, rating: 4.9, sold: "1,2k", delivery: 1, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=88", description: "Layout 75%, switch linear êm, kết nối ba chế độ và keycap PBT bền màu." },
  { id: 10, name: "Đèn bàn Halo Touch", category: "Nhà cửa", price: 399000, oldPrice: 550000, rating: 4.6, sold: "2,6k", delivery: 3, image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=88", description: "Ba nhiệt độ màu, điều khiển cảm ứng và chế độ bảo vệ mắt khi làm việc." },
];

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

export const getCart = (): CartLine[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem("nova-cart") ?? "[]");
  } catch {
    return [];
  }
};

export const saveCart = (cart: CartLine[]) => {
  window.localStorage.setItem("nova-cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("nova-cart-updated"));
};

export const addProductToCart = (product: Product, quantity = 1) => {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);
  const next = existing
    ? cart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)
    : [...cart, { ...product, quantity }];
  saveCart(next);
  return next;
};
