"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import {
  addProductToCart,
  formatPrice,
  type Product,
} from "../lib/catalog";

type SearchProduct = Product & {
  sellerId?: string;
  stock?: number;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [recommendations, setRecommendations] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("relevant");
  const [maxPrice, setMaxPrice] = useState(10_000_000);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("q") ?? "";
    setQuery(value);
    void fetch(`/api/products?q=${encodeURIComponent(value)}`, {
      cache: "no-store",
    })
      .then(
        async (response) =>
          (await response.json()) as {
          products?: SearchProduct[];
          recommendations?: SearchProduct[];
        },
      )
      .then((result) => {
          setProducts(result.products ?? []);
          setRecommendations(result.recommendations ?? []);
        },
      )
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const next = products.filter((product) => product.price <= maxPrice);
    if (sort === "price-asc") return [...next].sort((a, b) => a.price - b.price);
    if (sort === "rating") return [...next].sort((a, b) => b.rating - a.rating);
    if (sort === "delivery") {
      return [...next].sort((a, b) => a.delivery - b.delivery);
    }
    return next;
  }, [maxPrice, products, sort]);

  const cards = (items: SearchProduct[]) => (
    <div className="search-product-grid">
      {items.map((product) => (
        <article key={product.id}>
          <a href={`/product/${product.id}`}>
            <img src={product.image} alt={product.name} />
          </a>
          <p>{product.category}</p>
          <a href={`/product/${product.id}`}>{product.name}</a>
          <small>
            ★ {product.rating} · Giao {product.delivery} ngày ·{" "}
            {Number(product.stock ?? 0) > 0
              ? `Còn ${product.stock}`
              : "Kiểm tra tồn kho"}
          </small>
          <div>
            <strong>{formatPrice(product.price)}</strong>
            <button
              disabled={product.stock === 0}
              onClick={() => addProductToCart(product)}
            >
              Thêm
            </button>
          </div>
        </article>
      ))}
    </div>
  );

  return (
    <>
      <SiteHeader />
      <main className="search-page wrap">
        <header>
          <div>
            <p className="eyebrow">TÌM KIẾM THÔNG MINH</p>
            <h1>{query ? `Kết quả cho “${query}”` : "Sản phẩm nổi bật"}</h1>
            <p>
              Xếp hạng theo độ khớp tên, danh mục, mô tả, đánh giá và mức độ
              quan tâm.
            </p>
          </div>
          <span>{visible.length} kết quả</span>
        </header>
        <section className="search-toolbar">
          <label>
            Sắp xếp
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="relevant">Phù hợp nhất</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="rating">Đánh giá cao</option>
              <option value="delivery">Giao nhanh</option>
            </select>
          </label>
          <label>
            Giá tối đa: {formatPrice(maxPrice)}
            <input
              type="range"
              min={300000}
              max={10_000_000}
              step={100000}
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
            />
          </label>
        </section>
        {loading ? (
          <div className="platform-loading">Đang tìm trong danh mục D1…</div>
        ) : visible.length ? (
          cards(visible)
        ) : (
          <section className="search-empty">
            <span>⌕</span>
            <h2>Chưa thấy sản phẩm phù hợp</h2>
            <p>Thử từ khóa ngắn hơn hoặc tăng khoảng giá.</p>
          </section>
        )}
        {recommendations.length > 0 && (
          <section className="recommendation-section">
            <p className="eyebrow">GỢI Ý CHO BẠN</p>
            <h2>Có thể bạn cũng quan tâm</h2>
            {cards(recommendations)}
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
