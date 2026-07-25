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

export type CartLine = Product & {
  quantity: number;
  variant?: string;
};

export type Voucher = {
  code: string;
  label: string;
  discount: number;
  minSubtotal: number;
  active: boolean;
};

export const MANAGED_PRODUCTS_KEY = "nova-admin-products";
export const ADMIN_STOCKS_KEY = "nova-admin-stocks";
export const ADMIN_VISIBILITY_KEY = "nova-admin-visibility";
export const VOUCHERS_KEY = "nova-vouchers";
export const PRODUCTS_UPDATED_EVENT = "nova-products-updated";
export const VOUCHERS_UPDATED_EVENT = "nova-vouchers-updated";

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

export const defaultVouchers: Voucher[] = [
  {
    code: "NOVA50",
    label: "Giảm 50.000đ cho đơn từ 499.000đ",
    discount: 50000,
    minSubtotal: 499000,
    active: true,
  },
  {
    code: "HELLO100",
    label: "Giảm 100.000đ cho đơn đầu tiên từ 1.500.000đ",
    discount: 100000,
    minSubtotal: 1500000,
    active: false,
  },
];

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const parseStoredArray = <T>(key: string, fallback: T[]): T[] => {
  if (typeof window === "undefined") return fallback;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "null");
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export const getManagedProducts = (): Product[] =>
  parseStoredArray<Product>(MANAGED_PRODUCTS_KEY, products);

export const saveManagedProducts = (next: Product[]) => {
  window.localStorage.setItem(MANAGED_PRODUCTS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(PRODUCTS_UPDATED_EVENT));
};

export const getAdminStocks = (catalog = getManagedProducts()) => {
  const defaults = Object.fromEntries(
    catalog.map((product, index) => [
      product.id,
      index % 4 === 0 ? 8 : 42 + index * 7,
    ]),
  ) as Record<number, number>;
  if (typeof window === "undefined") return defaults;
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(ADMIN_STOCKS_KEY) ?? "{}",
    ) as Record<number, number>;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
};

export const saveAdminStocks = (next: Record<number, number>) => {
  window.localStorage.setItem(ADMIN_STOCKS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(PRODUCTS_UPDATED_EVENT));
};

export const getProductStock = (id: number) =>
  Math.max(0, getAdminStocks()[id] ?? 0);

export const getAdminVisibility = (catalog = getManagedProducts()) => {
  const defaults = Object.fromEntries(
    catalog.map((product) => [product.id, true]),
  ) as Record<number, boolean>;
  if (typeof window === "undefined") return defaults;
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(ADMIN_VISIBILITY_KEY) ?? "{}",
    ) as Record<number, boolean>;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
};

export const saveAdminVisibility = (next: Record<number, boolean>) => {
  window.localStorage.setItem(ADMIN_VISIBILITY_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(PRODUCTS_UPDATED_EVENT));
};

export const getVouchers = (): Voucher[] =>
  parseStoredArray<Voucher>(VOUCHERS_KEY, defaultVouchers);

export const saveVouchers = (next: Voucher[]) => {
  window.localStorage.setItem(VOUCHERS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(VOUCHERS_UPDATED_EVENT));
};

export const getVoucherByCode = (code: string) =>
  getVouchers().find(
    (voucher) =>
      voucher.active && voucher.code === code.trim().toUpperCase(),
  );

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

export const cartLineKey = (line: Pick<CartLine, "id" | "variant">) =>
  `${line.id}:${line.variant ?? "Tiêu chuẩn"}`;

export const addProductToCart = (
  product: Product,
  quantity = 1,
  variant = "Tiêu chuẩn",
) => {
  const cart = getCart();
  const stock = getProductStock(product.id);
  if (stock === 0) return cart;
  const key = cartLineKey({ id: product.id, variant });
  const existing = cart.find((item) => cartLineKey(item) === key);
  const productQuantityInCart = cart
    .filter((item) => item.id === product.id)
    .reduce((sum, item) => sum + item.quantity, 0);
  const allowedQuantity = Math.max(
    0,
    Math.min(quantity, stock - productQuantityInCart),
  );
  if (allowedQuantity === 0) return cart;
  const next = existing
    ? cart.map((item) =>
        cartLineKey(item) === key
          ? { ...item, quantity: item.quantity + allowedQuantity }
          : item,
      )
    : [...cart, { ...product, quantity: allowedQuantity, variant }];
  saveCart(next);
  return next;
};
