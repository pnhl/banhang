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
  discountType?: "fixed" | "percent";
  percentage?: number;
  maxDiscount?: number;
  minSubtotal: number;
  active: boolean;
  startsAt?: string;
  expiresAt?: string;
  usageLimit?: number;
  perCustomerLimit?: number;
  budget?: number;
  sellerId?: string;
};

export type VoucherRedemption = {
  id: string;
  code: string;
  orderId: string;
  customerKey: string;
  amount: number;
  sellerId?: string;
  createdAt: string;
};

export type VoucherValidation = {
  valid: boolean;
  code: string;
  discount: number;
  message: string;
  voucher?: Voucher;
};

export const MANAGED_PRODUCTS_KEY = "nova-admin-products";
export const ADMIN_STOCKS_KEY = "nova-admin-stocks";
export const ADMIN_VISIBILITY_KEY = "nova-admin-visibility";
export const VOUCHERS_KEY = "nova-vouchers";
export const VOUCHER_REDEMPTIONS_KEY = "nova-voucher-redemptions";
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
    discountType: "fixed",
    minSubtotal: 499000,
    active: true,
    startsAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-12-31T16:59:59.999Z",
    usageLimit: 5000,
    perCustomerLimit: 2,
    budget: 250000000,
  },
  {
    code: "HELLO100",
    label: "Giảm 100.000đ cho đơn đầu tiên từ 1.500.000đ",
    discount: 100000,
    discountType: "fixed",
    minSubtotal: 1500000,
    active: true,
    startsAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-12-31T16:59:59.999Z",
    usageLimit: 1000,
    perCustomerLimit: 1,
    budget: 100000000,
  },
  {
    code: "CLOUD15",
    label: "Giảm 15% tối đa 120.000đ tại Cloud Lifestyle",
    discount: 0,
    discountType: "percent",
    percentage: 15,
    maxDiscount: 120000,
    minSubtotal: 500000,
    active: true,
    startsAt: "2026-07-01T00:00:00.000Z",
    expiresAt: "2026-09-30T16:59:59.999Z",
    usageLimit: 800,
    perCustomerLimit: 1,
    budget: 60000000,
    sellerId: "cloud-lifestyle",
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
  parseStoredArray<Voucher>(VOUCHERS_KEY, defaultVouchers).map((voucher) => ({
    discountType: "fixed",
    usageLimit: 0,
    perCustomerLimit: 0,
    budget: 0,
    ...voucher,
    code: voucher.code.trim().toUpperCase(),
  }));

export const saveVouchers = (next: Voucher[]) => {
  window.localStorage.setItem(VOUCHERS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(VOUCHERS_UPDATED_EVENT));
};

export const getVoucherByCode = (code: string) =>
  getVouchers().find(
    (voucher) =>
      voucher.active && voucher.code === code.trim().toUpperCase(),
  );

export const getVoucherRedemptions = () =>
  parseStoredArray<VoucherRedemption>(VOUCHER_REDEMPTIONS_KEY, []);

export function getVoucherStats(code: string) {
  const redemptions = getVoucherRedemptions().filter(
    (item) => item.code === code.trim().toUpperCase(),
  );
  return {
    usedCount: redemptions.length,
    spent: redemptions.reduce((sum, item) => sum + item.amount, 0),
  };
}

export function validateVoucher(
  code: string,
  {
    subtotal,
    customerKey = "guest",
    sellerSubtotals = {},
    now = new Date(),
  }: {
    subtotal: number;
    customerKey?: string;
    sellerSubtotals?: Record<string, number>;
    now?: Date;
  },
): VoucherValidation {
  const normalizedCode = code.trim().toUpperCase();
  const voucher = getVouchers().find(
    (item) => item.code === normalizedCode,
  );
  if (!voucher || !voucher.active) {
    return {
      valid: false,
      code: normalizedCode,
      discount: 0,
      message: "Mã không tồn tại hoặc đang tạm dừng.",
    };
  }

  const startsAt = voucher.startsAt ? new Date(voucher.startsAt) : null;
  const expiresAt = voucher.expiresAt ? new Date(voucher.expiresAt) : null;
  if (startsAt && startsAt.getTime() > now.getTime()) {
    return {
      valid: false,
      code: normalizedCode,
      discount: 0,
      voucher,
      message: "Mã ưu đãi chưa đến thời gian áp dụng.",
    };
  }
  if (expiresAt && expiresAt.getTime() < now.getTime()) {
    return {
      valid: false,
      code: normalizedCode,
      discount: 0,
      voucher,
      message: "Mã ưu đãi đã hết hạn.",
    };
  }

  const eligibleSubtotal = voucher.sellerId
    ? sellerSubtotals[voucher.sellerId] ?? 0
    : subtotal;
  if (voucher.sellerId && eligibleSubtotal <= 0) {
    return {
      valid: false,
      code: normalizedCode,
      discount: 0,
      voucher,
      message: "Giỏ hàng chưa có sản phẩm thuộc gian hàng áp dụng mã.",
    };
  }
  if (eligibleSubtotal < voucher.minSubtotal) {
    return {
      valid: false,
      code: normalizedCode,
      discount: 0,
      voucher,
      message: `Phần hàng đủ điều kiện cần đạt ${formatPrice(voucher.minSubtotal)}.`,
    };
  }

  const redemptions = getVoucherRedemptions().filter(
    (item) => item.code === normalizedCode,
  );
  if (voucher.usageLimit && redemptions.length >= voucher.usageLimit) {
    return {
      valid: false,
      code: normalizedCode,
      discount: 0,
      voucher,
      message: "Mã ưu đãi đã hết lượt sử dụng.",
    };
  }
  const customerUses = redemptions.filter(
    (item) => item.customerKey === customerKey,
  ).length;
  if (
    voucher.perCustomerLimit &&
    customerUses >= voucher.perCustomerLimit
  ) {
    return {
      valid: false,
      code: normalizedCode,
      discount: 0,
      voucher,
      message: "Bạn đã sử dụng hết số lượt cho mã này.",
    };
  }

  let discount =
    voucher.discountType === "percent"
      ? Math.round(
          eligibleSubtotal * Math.max(0, voucher.percentage ?? 0) * 0.01,
        )
      : Math.max(0, voucher.discount);
  if (voucher.maxDiscount) discount = Math.min(discount, voucher.maxDiscount);
  discount = Math.min(discount, eligibleSubtotal);

  const spent = redemptions.reduce((sum, item) => sum + item.amount, 0);
  if (voucher.budget) {
    const remainingBudget = Math.max(0, voucher.budget - spent);
    if (remainingBudget <= 0) {
      return {
        valid: false,
        code: normalizedCode,
        discount: 0,
        voucher,
        message: "Ngân sách của mã ưu đãi đã được sử dụng hết.",
      };
    }
    discount = Math.min(discount, remainingBudget);
  }

  return {
    valid: discount > 0,
    code: normalizedCode,
    discount,
    voucher,
    message:
      discount > 0
        ? `Áp dụng thành công, giảm ${formatPrice(discount)}.`
        : "Mã ưu đãi chưa tạo ra mức giảm hợp lệ.",
  };
}

export function recordVoucherRedemption(
  redemption: Omit<VoucherRedemption, "id" | "createdAt">,
) {
  const next: VoucherRedemption = {
    ...redemption,
    code: redemption.code.trim().toUpperCase(),
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `voucher-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  window.localStorage.setItem(
    VOUCHER_REDEMPTIONS_KEY,
    JSON.stringify([...getVoucherRedemptions(), next]),
  );
  window.dispatchEvent(new Event(VOUCHERS_UPDATED_EVENT));
  return next;
}

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
