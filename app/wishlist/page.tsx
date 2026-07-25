"use client";

import { useEffect, useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { getWishlistIds, toggleWishlist } from "../lib/account";
import {
  addProductToCart,
  formatPrice,
  getAdminStocks,
  getManagedProducts,
  Product,
  products,
  PRODUCTS_UPDATED_EVENT,
} from "../lib/catalog";

export default function WishlistPage() {
  const [ids, setIds] = useState<number[]>([]);
  const [toast, setToast] = useState("");
  const [catalog, setCatalog] = useState<Product[]>(products);
  const [stocks, setStocks] = useState<Record<number, number>>({});

  useEffect(() => {
    const sync = () => {
      const managed = getManagedProducts();
      setCatalog(managed);
      setStocks(getAdminStocks(managed));
    };
    setIds(getWishlistIds());
    sync();
    window.addEventListener(PRODUCTS_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const wished = catalog.filter((product) => ids.includes(product.id));

  const remove = (id: number) => setIds(toggleWishlist(id));
  const add = (id: number) => {
    const product = catalog.find((item) => item.id === id);
    if (!product) return;
    if ((stocks[id] ?? 0) === 0) {
      setToast("Sản phẩm đang tạm hết hàng.");
      window.setTimeout(() => setToast(""), 2200);
      return;
    }
    addProductToCart(product);
    setToast(`Đã thêm “${product.name}” vào giỏ`);
    window.setTimeout(() => setToast(""), 2200);
  };

  return (
    <>
      <SiteHeader />
      <div className="page-breadcrumb wrap"><a href="/">Trang chủ</a><span>›</span><b>Yêu thích</b></div>
      <main className="wishlist-page wrap">
        <header><div><p className="eyebrow">BỘ SƯU TẬP CỦA BẠN</p><h1>Sản phẩm yêu thích</h1></div><span>{wished.length} sản phẩm</span></header>
        {wished.length === 0 ? (
          <div className="wishlist-empty"><span>♡</span><h2>Danh sách đang trống</h2><p>Nhấn biểu tượng trái tim trên sản phẩm để lưu lại cho lần sau.</p><a href="/#products">Khám phá sản phẩm</a></div>
        ) : (
          <section className="wishlist-grid">
            {wished.map((product) => (
              <article key={product.id}>
                <button className="heart active" aria-label={`Bỏ yêu thích ${product.name}`} onClick={() => remove(product.id)}>♥</button>
                <a href={`/product/${product.id}`}><img src={product.image} alt={product.name} /></a>
                <p>{product.category}</p>
                <a href={`/product/${product.id}`}>{product.name}</a>
                <div><strong>{formatPrice(product.price)}</strong><del>{formatPrice(product.oldPrice)}</del></div>
                <button
                  disabled={(stocks[product.id] ?? 0) === 0}
                  onClick={() => add(product.id)}
                >
                  {(stocks[product.id] ?? 0) === 0
                    ? "Tạm hết hàng"
                    : "Thêm vào giỏ"}
                </button>
              </article>
            ))}
          </section>
        )}
      </main>
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
      <SiteFooter />
    </>
  );
}
