"use client";

import { type FormEvent, useEffect, useState } from "react";
import { trackCommerceEvent } from "../../lib/analytics";
import {
  getProfile,
  getWishlistIds,
  toggleWishlist,
} from "../../lib/account";
import {
  addProductToCart,
  formatPrice,
  getManagedProducts,
  getProductStock,
  Product,
  products,
  PRODUCTS_UPDATED_EVENT,
} from "../../lib/catalog";
import {
  addRecentlyViewed,
  COMPARE_UPDATED_EVENT,
  getApprovedReviews,
  getCompareIds,
  ProductReview,
  REVIEWS_UPDATED_EVENT,
  submitReview,
  toggleCompare,
} from "../../lib/engagement";
import { getSellerForProduct } from "../../lib/marketplace";

export function ProductDetailResolver({
  productId,
  initialProduct,
}: {
  productId: number;
  initialProduct?: Product;
}) {
  const [catalog, setCatalog] = useState<Product[]>(products);
  const [product, setProduct] = useState<Product | undefined>(initialProduct);
  const [ready, setReady] = useState(Boolean(initialProduct));

  useEffect(() => {
    const sync = () => {
      const managed = getManagedProducts();
      setCatalog(managed);
      setProduct(managed.find((item) => item.id === productId));
      setReady(true);
    };
    sync();
    window.addEventListener(PRODUCTS_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [productId]);

  if (!ready) {
    return (
      <main className="product-missing wrap">
        <span>◇</span>
        <h1>Đang tải sản phẩm...</h1>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="product-missing wrap">
        <span>⌕</span>
        <h1>Sản phẩm không còn hiển thị</h1>
        <p>
          Sản phẩm có thể đã được gỡ khỏi danh mục hoặc đường dẫn không còn
          chính xác.
        </p>
        <a href="/#products">Quay lại danh sách sản phẩm</a>
      </main>
    );
  }

  return <ProductDetailClient product={product} catalog={catalog} />;
}

export function ProductDetailClient({
  product,
  catalog = products,
}: {
  product: Product;
  catalog?: Product[];
}) {
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState("description");
  const [toast, setToast] = useState("");
  const [liked, setLiked] = useState(false);
  const [variant, setVariant] = useState("Cát nhạt");
  const [stock, setStock] = useState(0);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [reviewNotice, setReviewNotice] = useState("");
  const [reviewDraft, setReviewDraft] = useState({
    author: "",
    email: "",
    rating: 5,
    title: "",
    comment: "",
  });
  const related = catalog
    .filter(
      (item) =>
        item.category === product.category && item.id !== product.id,
    )
    .slice(0, 3);
  const seller = getSellerForProduct(product.id);

  useEffect(() => {
    const syncStock = () => {
      const nextStock = getProductStock(product.id);
      setStock(nextStock);
      setQuantity((current) =>
        Math.max(1, Math.min(current, Math.max(1, nextStock))),
      );
    };
    setLiked(getWishlistIds().includes(product.id));
    const profile = getProfile();
    setReviewDraft((current) => ({
      ...current,
      author: profile?.name ?? current.author,
      email: profile?.email ?? current.email,
    }));
    const syncReviews = () =>
      setReviews(getApprovedReviews(product.id));
    const syncCompare = () => setCompareIds(getCompareIds());
    syncStock();
    syncReviews();
    syncCompare();
    addRecentlyViewed(product.id);
    trackCommerceEvent("view_item", {
      currency: "VND",
      value: product.price,
      seller_id: seller.id,
      items: [
        {
          item_id: String(product.id),
          item_name: product.name,
          item_category: product.category,
          item_brand: seller.name,
          price: product.price,
          quantity: 1,
        },
      ],
    });
    window.addEventListener(PRODUCTS_UPDATED_EVENT, syncStock);
    window.addEventListener(REVIEWS_UPDATED_EVENT, syncReviews);
    window.addEventListener(COMPARE_UPDATED_EVENT, syncCompare);
    window.addEventListener("storage", syncReviews);
    window.addEventListener("storage", syncCompare);
    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, syncStock);
      window.removeEventListener(REVIEWS_UPDATED_EVENT, syncReviews);
      window.removeEventListener(COMPARE_UPDATED_EVENT, syncCompare);
      window.removeEventListener("storage", syncReviews);
      window.removeEventListener("storage", syncCompare);
    };
  }, [
    product.category,
    product.id,
    product.name,
    product.price,
    seller.id,
    seller.name,
  ]);

  const reviewAverage = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : product.rating;

  const add = (buyNow = false) => {
    if (stock === 0) {
      setToast("Sản phẩm đang tạm hết hàng.");
      window.setTimeout(() => setToast(""), 2200);
      return;
    }
    addProductToCart(product, quantity, variant);
    trackCommerceEvent("add_to_cart", {
      currency: "VND",
      value: product.price * quantity,
      seller_id: seller.id,
      items: [
        {
          item_id: String(product.id),
          item_name: product.name,
          item_category: product.category,
          item_brand: seller.name,
          item_variant: variant,
          price: product.price,
          quantity,
        },
      ],
    });
    if (buyNow) window.location.href = "/checkout";
    else {
      setToast(`Đã thêm ${quantity} sản phẩm · ${variant} vào giỏ`);
      window.setTimeout(() => setToast(""), 2200);
    }
  };

  const toggleComparison = () => {
    const alreadySelected = compareIds.includes(product.id);
    const next = toggleCompare(product.id);
    setCompareIds(next);
    setToast(
      !alreadySelected && next.length === compareIds.length
        ? "Bạn chỉ có thể so sánh tối đa 3 sản phẩm."
        : alreadySelected
          ? "Đã bỏ sản phẩm khỏi danh sách so sánh."
          : "Đã thêm vào danh sách so sánh.",
    );
    window.setTimeout(() => setToast(""), 2200);
  };

  const sendReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitReview({
      productId: product.id,
      ...reviewDraft,
    });
    setReviewDraft((current) => ({
      ...current,
      rating: 5,
      title: "",
      comment: "",
    }));
    setReviewNotice(
      "Cảm ơn bạn. Đánh giá đã được gửi và sẽ hiển thị sau khi quản trị viên duyệt.",
    );
  };

  return (
    <>
      <div className="page-breadcrumb wrap"><a href="/">Trang chủ</a><span>›</span><a href="/#products">{product.category}</a><span>›</span><b>{product.name}</b></div>
      <section className="product-page wrap">
        <div className="product-page-gallery">
          {product.badge && <span>{product.badge}</span>}
          <img src={product.image} alt={product.name} />
          <div className="thumbs"><button className="active"><img src={product.image} alt="" /></button><button><img src={product.image} alt="" /></button><button><img src={product.image} alt="" /></button></div>
        </div>
        <div className="product-page-info">
          <p className="eyebrow">NOVA CHOICE · {product.category}</p>
          <h1>{product.name}</h1>
          <div className="detail-rating"><b>★ {reviewAverage.toFixed(1)}</b><span>{reviews.length} đánh giá đã duyệt</span><span>Đã bán {product.sold}</span></div>
          <div className="detail-price"><strong>{formatPrice(product.price)}</strong><del>{formatPrice(product.oldPrice)}</del><b>Tiết kiệm {Math.round((1 - product.price / product.oldPrice) * 100)}%</b></div>
          <p className="detail-lead">{product.description}</p>
          <div className="detail-choice">
            <label>Màu sắc</label>
            <div>
              {["Cát nhạt", "Than chì", "Xanh rêu"].map((option) => (
                <button
                  key={option}
                  className={variant === option ? "selected" : ""}
                  onClick={() => setVariant(option)}
                  aria-pressed={variant === option}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="detail-choice"><label>Số lượng</label><div className="detail-quantity"><button disabled={stock === 0} onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Giảm số lượng">−</button><b>{quantity}</b><button disabled={stock === 0 || quantity >= Math.min(10, stock)} onClick={() => setQuantity(Math.min(10, stock, quantity + 1))} aria-label="Tăng số lượng">＋</button><span>{stock === 0 ? "Tạm hết hàng" : `Còn ${stock} sản phẩm · tối đa ${Math.min(10, stock)} mỗi đơn`}</span></div></div>
          <div className="detail-actions"><button disabled={stock === 0} onClick={() => add(false)}>{stock === 0 ? "Tạm hết hàng" : "Thêm vào giỏ"}</button><button disabled={stock === 0} onClick={() => add(true)}>Mua ngay · {formatPrice(product.price * quantity)}</button></div>
          <div className="detail-secondary-actions">
            <button className={`detail-wishlist ${liked ? "active" : ""}`} onClick={() => setLiked(toggleWishlist(product.id).includes(product.id))}>{liked ? "♥ Đã lưu vào yêu thích" : "♡ Lưu sản phẩm yêu thích"}</button>
            <button className={compareIds.includes(product.id) ? "active" : ""} onClick={toggleComparison}>
              {compareIds.includes(product.id) ? "✓ Đang so sánh" : "⇄ Thêm vào so sánh"}
            </button>
          </div>
          <div className="detail-benefits"><p><span>↺</span><b>Đổi trả 15 ngày<small>Miễn phí, dễ dàng</small></b></p><p><span>♢</span><b>Chính hãng 100%<small>Hoàn tiền nếu phát hiện giả</small></b></p><p><span>⚡</span><b>Giao trong {product.delivery} ngày<small>Theo dõi theo thời gian thực</small></b></p></div>
          <a className="product-seller-card" href={`/store/${seller.slug}`}>
            <span style={{ background: seller.accent }}>{seller.shortName}</span>
            <p>
              <small>Bán và chịu trách nhiệm bởi</small>
              <b>{seller.name} {seller.verified && "✓"}</b>
              <em>★ {seller.rating} · Phản hồi {seller.responseRate}%</em>
            </p>
            <strong>Xem gian hàng →</strong>
          </a>
        </div>
      </section>

      <section className="product-content wrap">
        <div className="product-tabs">
          <button className={tab === "description" ? "active" : ""} onClick={() => setTab("description")}>Mô tả sản phẩm</button>
          <button className={tab === "specs" ? "active" : ""} onClick={() => setTab("specs")}>Thông số</button>
          <button className={tab === "reviews" ? "active" : ""} onClick={() => setTab("reviews")}>Đánh giá ({reviews.length})</button>
        </div>
        {tab === "description" && <div className="tab-copy"><h2>Được thiết kế cho nhịp sống hiện đại</h2><p>{product.description} Mỗi chi tiết đều được lựa chọn kỹ để cân bằng giữa thẩm mỹ, độ bền và trải nghiệm sử dụng hằng ngày.</p><div className="feature-grid"><div><b>01</b><h3>Thiết kế tinh giản</h3><p>Dễ phối hợp trong mọi không gian và phong cách cá nhân.</p></div><div><b>02</b><h3>Vật liệu tuyển chọn</h3><p>Bền bỉ, dễ chăm sóc và an toàn trong quá trình sử dụng.</p></div><div><b>03</b><h3>Bảo hành rõ ràng</h3><p>Hỗ trợ chính hãng trong 12 tháng tại hệ thống NOVA.</p></div></div></div>}
        {tab === "specs" && <div className="spec-table"><p><span>Thương hiệu</span><b>NOVA Selection</b></p><p><span>Xuất xứ</span><b>Thiết kế tại Việt Nam</b></p><p><span>Bảo hành</span><b>12 tháng</b></p><p><span>Đóng gói</span><b>Sản phẩm, phụ kiện, hướng dẫn</b></p></div>}
        {tab === "reviews" && (
          <div className="review-experience">
            <aside className="review-summary">
              <strong>{reviewAverage.toFixed(1)}</strong>
              <span>{"★".repeat(Math.round(reviewAverage))}{"☆".repeat(5 - Math.round(reviewAverage))}</span>
              <p>{reviews.length} đánh giá đã được kiểm duyệt</p>
              <small>Đánh giá mới sẽ được admin duyệt trước khi công khai.</small>
            </aside>
            <div className="review-stream">
              {reviews.map((review) => (
                <article key={review.id}>
                  <header>
                    <div>
                      <b>{review.author}</b>
                      {review.verifiedPurchase && <span>✓ Đã mua hàng</span>}
                    </div>
                    <time>
                      {new Intl.DateTimeFormat("vi-VN").format(
                        new Date(review.createdAt),
                      )}
                    </time>
                  </header>
                  <p className="review-stars">
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  </p>
                  <h3>{review.title}</h3>
                  <p>{review.comment}</p>
                </article>
              ))}
              {reviews.length === 0 && (
                <div className="review-empty">
                  <span>☆</span>
                  <h3>Hãy là người đánh giá đầu tiên</h3>
                  <p>Chia sẻ trải nghiệm để giúp khách hàng khác lựa chọn tốt hơn.</p>
                </div>
              )}
            </div>
            <form className="review-form" onSubmit={sendReview}>
              <div>
                <p className="eyebrow">CHIA SẺ TRẢI NGHIỆM</p>
                <h2>Viết đánh giá</h2>
              </div>
              <label>
                Mức độ hài lòng
                <span className="review-rating-input">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      type="button"
                      key={rating}
                      className={rating <= reviewDraft.rating ? "active" : ""}
                      onClick={() =>
                        setReviewDraft((current) => ({ ...current, rating }))
                      }
                      aria-label={`${rating} sao`}
                    >
                      ★
                    </button>
                  ))}
                </span>
              </label>
              <div className="two-col">
                <label>
                  Tên hiển thị
                  <input
                    required
                    value={reviewDraft.author}
                    onChange={(event) =>
                      setReviewDraft((current) => ({
                        ...current,
                        author: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={reviewDraft.email}
                    onChange={(event) =>
                      setReviewDraft((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="Không hiển thị công khai"
                  />
                </label>
              </div>
              <label>
                Tiêu đề
                <input
                  required
                  value={reviewDraft.title}
                  onChange={(event) =>
                    setReviewDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Điều bạn ấn tượng nhất"
                />
              </label>
              <label>
                Nội dung
                <textarea
                  required
                  minLength={20}
                  rows={4}
                  value={reviewDraft.comment}
                  onChange={(event) =>
                    setReviewDraft((current) => ({
                      ...current,
                      comment: event.target.value,
                    }))
                  }
                  placeholder="Mô tả chất lượng, đóng gói và trải nghiệm sử dụng"
                />
              </label>
              <button className="primary-submit">Gửi đánh giá</button>
              {reviewNotice && <small className="review-notice">{reviewNotice}</small>}
            </form>
          </div>
        )}
      </section>

      <section className="related wrap"><p className="eyebrow">CÓ THỂ BẠN CŨNG THÍCH</p><h2>Sản phẩm cùng danh mục</h2><div>{related.map((item) => <a href={`/product/${item.id}`} key={item.id}><img src={item.image} alt={item.name} /><p>{item.name}</p><strong>{formatPrice(item.price)}</strong></a>)}</div></section>
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </>
  );
}
