import { getOrders, getProfile } from "./account";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type ProductReview = {
  id: string;
  productId: number;
  author: string;
  email?: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  status: ReviewStatus;
  verifiedPurchase: boolean;
};

const REVIEWS_KEY = "nova-reviews";
const RECENTLY_VIEWED_KEY = "nova-recently-viewed";
const COMPARE_KEY = "nova-compare";

export const REVIEWS_UPDATED_EVENT = "nova-reviews-updated";
export const RECENTLY_VIEWED_UPDATED_EVENT = "nova-recently-viewed-updated";
export const COMPARE_UPDATED_EVENT = "nova-compare-updated";

const seededReviews: ProductReview[] = [
  {
    id: "RV-DEMO-01",
    productId: 1,
    author: "Minh Anh",
    rating: 5,
    title: "Đeo lâu vẫn rất thoải mái",
    comment:
      "Khả năng chống ồn tốt, pin dùng nhiều ngày và đóng gói chắc chắn. Giao hàng sớm hơn dự kiến.",
    createdAt: "2026-07-18T08:30:00.000Z",
    status: "approved",
    verifiedPurchase: true,
  },
  {
    id: "RV-DEMO-02",
    productId: 1,
    author: "Hoàng Nam",
    rating: 4,
    title: "Âm thanh cân bằng",
    comment:
      "Kết nối nhanh và phần đệm tai mềm. Mình mong ứng dụng điều khiển có thêm nhiều cấu hình EQ.",
    createdAt: "2026-07-16T13:10:00.000Z",
    status: "approved",
    verifiedPurchase: true,
  },
  {
    id: "RV-DEMO-03",
    productId: 2,
    author: "Thùy Dương",
    rating: 5,
    title: "Nhẹ và đúng kích thước",
    comment:
      "Đi cả ngày không bị đau chân, màu sắc giống ảnh và hộp giày còn nguyên vẹn khi nhận.",
    createdAt: "2026-07-20T04:45:00.000Z",
    status: "approved",
    verifiedPurchase: true,
  },
  {
    id: "RV-DEMO-04",
    productId: 6,
    author: "Lan Chi",
    rating: 5,
    title: "Dịu da và thấm nhanh",
    comment:
      "Kết cấu nhẹ, không nhờn rít. Sau khoảng hai tuần da của mình ẩm và ổn định hơn.",
    createdAt: "2026-07-21T11:20:00.000Z",
    status: "approved",
    verifiedPurchase: true,
  },
];

function readArray<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "null");
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function getReviews(): ProductReview[] {
  return readArray<ProductReview>(REVIEWS_KEY, seededReviews);
}

export function saveReviews(reviews: ProductReview[]) {
  window.localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  window.dispatchEvent(new Event(REVIEWS_UPDATED_EVENT));
}

export function getApprovedReviews(productId?: number) {
  return getReviews().filter(
    (review) =>
      review.status === "approved" &&
      (productId === undefined || review.productId === productId),
  );
}

export function submitReview(input: {
  productId: number;
  author: string;
  email?: string;
  rating: number;
  title: string;
  comment: string;
}) {
  const profile = getProfile();
  const review: ProductReview = {
    id: `RV-${Date.now()}`,
    productId: input.productId,
    author: input.author.trim() || profile?.name || "Khách hàng NOVA",
    email: input.email?.trim() || profile?.email,
    rating: Math.min(5, Math.max(1, Math.round(input.rating))),
    title: input.title.trim(),
    comment: input.comment.trim(),
    createdAt: new Date().toISOString(),
    status: "pending",
    verifiedPurchase: getOrders().some(
      (order) =>
        order.status === "Hoàn tất" &&
        order.items.some((item) => item.id === input.productId),
    ),
  };
  saveReviews([review, ...getReviews()]);
  return review;
}

export function updateReviewStatus(id: string, status: ReviewStatus) {
  const next = getReviews().map((review) =>
    review.id === id ? { ...review, status } : review,
  );
  saveReviews(next);
  return next;
}

export function deleteReview(id: string) {
  const next = getReviews().filter((review) => review.id !== id);
  saveReviews(next);
  return next;
}

export function addRecentlyViewed(productId: number) {
  const next = [
    productId,
    ...getRecentlyViewedIds().filter((id) => id !== productId),
  ].slice(0, 8);
  window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(RECENTLY_VIEWED_UPDATED_EVENT));
  return next;
}

export function getRecentlyViewedIds(): number[] {
  return readArray<number>(RECENTLY_VIEWED_KEY, []);
}

export function getCompareIds(): number[] {
  return readArray<number>(COMPARE_KEY, []);
}

export function toggleCompare(productId: number) {
  const current = getCompareIds();
  const next = current.includes(productId)
    ? current.filter((id) => id !== productId)
    : current.length >= 3
      ? current
      : [...current, productId];
  window.localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(COMPARE_UPDATED_EVENT));
  return next;
}

