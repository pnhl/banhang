import type { CartLine } from "./catalog";

export type AccountProfile = {
  name: string;
  email: string;
  phone: string;
  address?: string;
  addressDetail?: string;
  provinceCode?: number;
  province?: string;
  wardCode?: number;
  ward?: string;
};

export type OrderStatus =
  | "Chờ xác nhận"
  | "Đang đóng gói"
  | "Đang giao"
  | "Hoàn tất"
  | "Đã hủy";

export type NovaOrder = {
  id: string;
  createdAt: string;
  customer: AccountProfile;
  items: CartLine[];
  payment: string;
  shippingMethod?: string;
  shippingFee?: number;
  shippingNote?: string;
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
};

const PROFILE_KEY = "nova-profile";
const ORDERS_KEY = "nova-orders";
const WISHLIST_KEY = "nova-wishlist";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
}

export function getProfile(): AccountProfile | null {
  return readJson<AccountProfile | null>(PROFILE_KEY, null);
}

export function saveProfile(profile: AccountProfile) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event("nova-account-updated"));
}

export function signOutDemo() {
  window.localStorage.removeItem(PROFILE_KEY);
  window.dispatchEvent(new Event("nova-account-updated"));
}

export function getOrders(): NovaOrder[] {
  return readJson<NovaOrder[]>(ORDERS_KEY, []);
}

export function getOrder(id: string) {
  return getOrders().find((order) => order.id === id) ?? null;
}

export function saveOrders(orders: NovaOrder[]) {
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event("nova-orders-updated"));
}

export function createOrder(
  order: Omit<NovaOrder, "id" | "createdAt" | "status">,
) {
  const now = new Date();
  const id = `NV${now
    .toISOString()
    .slice(2, 10)
    .replaceAll("-", "")}${String(now.getTime()).slice(-4)}`;
  const next: NovaOrder = {
    ...order,
    id,
    createdAt: now.toISOString(),
    status: "Chờ xác nhận",
  };
  saveOrders([next, ...getOrders()]);
  return next;
}

export function cancelOrder(id: string) {
  const orders = getOrders();
  const target = orders.find((order) => order.id === id);
  if (!target || target.status !== "Chờ xác nhận") return null;
  const next = orders.map((order) =>
    order.id === id ? { ...order, status: "Đã hủy" as const } : order,
  );
  saveOrders(next);
  return next.find((order) => order.id === id) ?? null;
}

export function getWishlistIds(): number[] {
  return readJson<number[]>(WISHLIST_KEY, []);
}

export function toggleWishlist(id: number) {
  const current = getWishlistIds();
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];
  window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("nova-wishlist-updated"));
  return next;
}
