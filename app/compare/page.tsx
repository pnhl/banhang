"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import {
  addProductToCart,
  formatPrice,
  getAdminStocks,
  getManagedProducts,
  Product,
  products,
  PRODUCTS_UPDATED_EVENT,
} from "../lib/catalog";
import {
  COMPARE_UPDATED_EVENT,
  getCompareIds,
  toggleCompare,
} from "../lib/engagement";

export default function ComparePage() {
  const [catalog, setCatalog] = useState<Product[]>(products);
  const [ids, setIds] = useState<number[]>([]);
  const [stocks, setStocks] = useState<Record<number, number>>({});
  const [candidate, setCandidate] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const syncCatalog = () => {
      const managed = getManagedProducts();
      setCatalog(managed);
      setStocks(getAdminStocks(managed));
    };
    const syncCompare = () => setIds(getCompareIds());
    syncCatalog();
    syncCompare();
    window.addEventListener(PRODUCTS_UPDATED_EVENT, syncCatalog);
    window.addEventListener(COMPARE_UPDATED_EVENT, syncCompare);
    window.addEventListener("storage", syncCompare);
    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, syncCatalog);
      window.removeEventListener(COMPARE_UPDATED_EVENT, syncCompare);
      window.removeEventListener("storage", syncCompare);
    };
  }, []);

  const selected = useMemo(
    () =>
      ids
        .map((id) => catalog.find((product) => product.id === id))
        .filter((product): product is Product => Boolean(product)),
    [catalog, ids],
  );
  const available = catalog.filter((product) => !ids.includes(product.id));

  const addCandidate = () => {
    if (!candidate) return;
    const next = toggleCompare(Number(candidate));
    setIds(next);
    setCandidate("");
  };

  const addToCart = (product: Product) => {
    if ((stocks[product.id] ?? 0) === 0) return;
    addProductToCart(product);
    setToast(`Đã thêm “${product.name}” vào giỏ.`);
    window.setTimeout(() => setToast(""), 2200);
  };

  return (
    <>
      <SiteHeader />
      <div className="page-breadcrumb wrap">
        <a href="/">Trang chủ</a><span>›</span><b>So sánh sản phẩm</b>
      </div>
      <main className="compare-page wrap">
        <header>
          <div>
            <p className="eyebrow">CHỌN DỄ HƠN</p>
            <h1>So sánh sản phẩm</h1>
            <p>Đặt tối đa ba sản phẩm cạnh nhau để cân nhắc nhanh hơn.</p>
          </div>
          <div className="compare-picker">
            <select
              value={candidate}
              onChange={(event) => setCandidate(event.target.value)}
              disabled={ids.length >= 3}
              aria-label="Chọn sản phẩm để so sánh"
            >
              <option value="">
                {ids.length >= 3
                  ? "Đã đủ 3 sản phẩm"
                  : "Chọn thêm sản phẩm"}
              </option>
              {available.map((product) => (
                <option value={product.id} key={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <button
              disabled={!candidate || ids.length >= 3}
              onClick={addCandidate}
            >
              Thêm vào bảng
            </button>
          </div>
        </header>

        {selected.length === 0 ? (
          <section className="compare-empty">
            <span>⇄</span>
            <h2>Chưa có sản phẩm để so sánh</h2>
            <p>
              Dùng nút “So sánh” trên trang chi tiết hoặc chọn sản phẩm ở phía
              trên.
            </p>
            <a href="/#products">Khám phá sản phẩm</a>
          </section>
        ) : (
          <section
            className="compare-table"
            style={{
              "--compare-count": selected.length,
            } as React.CSSProperties}
          >
            <div className="compare-label compare-product-label">Sản phẩm</div>
            {selected.map((product) => (
              <article className="compare-product" key={product.id}>
                <button
                  aria-label={`Bỏ ${product.name} khỏi so sánh`}
                  onClick={() => setIds(toggleCompare(product.id))}
                >
                  ×
                </button>
                <a href={`/product/${product.id}`}>
                  <img src={product.image} alt={product.name} />
                </a>
                <p>{product.category}</p>
                <a href={`/product/${product.id}`}>{product.name}</a>
              </article>
            ))}

            <div className="compare-label">Giá bán</div>
            {selected.map((product) => (
              <div className="compare-value compare-price" key={`price-${product.id}`}>
                <strong>{formatPrice(product.price)}</strong>
                <del>{formatPrice(product.oldPrice)}</del>
              </div>
            ))}

            <div className="compare-label">Đánh giá</div>
            {selected.map((product) => (
              <div className="compare-value" key={`rating-${product.id}`}>
                <b className="stars">★ {product.rating}</b>
                <span>Đã bán {product.sold}</span>
              </div>
            ))}

            <div className="compare-label">Giao hàng</div>
            {selected.map((product) => (
              <div className="compare-value" key={`delivery-${product.id}`}>
                <b>{product.delivery === 1 ? "Trong 24 giờ" : `${product.delivery} ngày`}</b>
                <span>Theo dõi trực tuyến</span>
              </div>
            ))}

            <div className="compare-label">Tình trạng</div>
            {selected.map((product) => (
              <div className="compare-value" key={`stock-${product.id}`}>
                <b className={(stocks[product.id] ?? 0) > 0 ? "in-stock" : "out-stock"}>
                  {(stocks[product.id] ?? 0) > 0
                    ? `Còn ${stocks[product.id]} sản phẩm`
                    : "Tạm hết hàng"}
                </b>
              </div>
            ))}

            <div className="compare-label">Thao tác</div>
            {selected.map((product) => (
              <div className="compare-value compare-action" key={`action-${product.id}`}>
                <button
                  disabled={(stocks[product.id] ?? 0) === 0}
                  onClick={() => addToCart(product)}
                >
                  {(stocks[product.id] ?? 0) === 0
                    ? "Tạm hết hàng"
                    : "Thêm vào giỏ"}
                </button>
                <a href={`/product/${product.id}`}>Xem chi tiết</a>
              </div>
            ))}
          </section>
        )}
      </main>
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
      <SiteFooter />
    </>
  );
}

