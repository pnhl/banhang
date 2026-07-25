"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  getOrders,
  NovaOrder,
  OrderStatus,
  saveOrders,
} from "../lib/account";
import {
  defaultVouchers,
  formatPrice,
  getAdminStocks,
  getAdminVisibility,
  getManagedProducts,
  getVouchers,
  Product,
  products,
  saveAdminStocks,
  saveAdminVisibility,
  saveManagedProducts,
  saveVouchers,
  Voucher,
} from "../lib/catalog";
import {
  deleteReview,
  getReviews,
  ProductReview,
  REVIEWS_UPDATED_EVENT,
  ReviewStatus,
  updateReviewStatus,
} from "../lib/engagement";

type AdminOrder = {
  id: string;
  customer: string;
  email: string;
  product: string;
  value: number;
  status: OrderStatus;
  time: string;
  local: boolean;
};

type ProductDraft = Product & {
  stock: number;
};

const createProductDraft = (): ProductDraft => ({
  id: Date.now(),
  name: "",
  category: "Điện tử",
  price: 499000,
  oldPrice: 599000,
  rating: 4.8,
  sold: "0",
  delivery: 2,
  image:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=88",
  badge: "MỚI",
  description: "",
  stock: 25,
});

const seededOrders: AdminOrder[] = [
  {
    id: "NV240726",
    customer: "Minh Anh",
    email: "minhanh@example.com",
    product: "NovaSound Air",
    value: 1290000,
    status: "Chờ xác nhận",
    time: "10 phút trước",
    local: false,
  },
  {
    id: "NV240725",
    customer: "Hoàng Nam",
    email: "hoangnam@example.com",
    product: "Cloud Walk × 2",
    value: 1378000,
    status: "Đang giao",
    time: "35 phút trước",
    local: false,
  },
  {
    id: "NV240724",
    customer: "Thùy Dương",
    email: "thuyduong@example.com",
    product: "Dew Lab",
    value: 459000,
    status: "Hoàn tất",
    time: "1 giờ trước",
    local: false,
  },
  {
    id: "NV240723",
    customer: "Quốc Bảo",
    email: "quocbao@example.com",
    product: "Studio 75",
    value: 1490000,
    status: "Đang đóng gói",
    time: "2 giờ trước",
    local: false,
  },
];

const statusOptions: OrderStatus[] = [
  "Chờ xác nhận",
  "Đang đóng gói",
  "Đang giao",
  "Hoàn tất",
  "Đã hủy",
];

function toAdminOrder(order: NovaOrder): AdminOrder {
  return {
    id: order.id,
    customer: order.customer.name,
    email: order.customer.email,
    product:
      order.items.length === 1
        ? order.items[0].name
        : `${order.items[0]?.name ?? "Sản phẩm"} +${order.items.length - 1}`,
    value: order.total,
    status: order.status,
    time: new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(order.createdAt)),
    local: true,
  };
}

export function AdminDashboard() {
  const [section, setSection] = useState("overview");
  const [orderFilter, setOrderFilter] = useState("Tất cả");
  const [reviewFilter, setReviewFilter] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>(seededOrders);
  const [managedProducts, setManagedProducts] = useState<Product[]>(products);
  const [stocks, setStocks] = useState<Record<number, number>>(() =>
    getAdminStocks(products),
  );
  const [visibility, setVisibility] = useState<Record<number, boolean>>(() =>
    getAdminVisibility(products),
  );
  const [productDraft, setProductDraft] = useState<ProductDraft | null>(null);
  const [vouchers, setVoucherState] = useState<Voucher[]>(defaultVouchers);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [voucherDraft, setVoucherDraft] = useState({
    code: "",
    label: "",
    discount: 50000,
    minSubtotal: 499000,
  });

  useEffect(() => {
    const sync = () => {
      const localOrders = getOrders().map(toAdminOrder);
      setOrders([...localOrders, ...seededOrders]);
    };
    sync();
    const catalog = getManagedProducts();
    setManagedProducts(catalog);
    setStocks(getAdminStocks(catalog));
    setVisibility(getAdminVisibility(catalog));
    setVoucherState(getVouchers());
    const syncReviews = () => setReviews(getReviews());
    syncReviews();
    window.addEventListener("nova-orders-updated", sync);
    window.addEventListener(REVIEWS_UPDATED_EVENT, syncReviews);
    return () => {
      window.removeEventListener("nova-orders-updated", sync);
      window.removeEventListener(REVIEWS_UPDATED_EVENT, syncReviews);
    };
  }, []);

  const visibleOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          (orderFilter === "Tất cả" || order.status === orderFilter) &&
          `${order.id} ${order.customer} ${order.email}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [orderFilter, orders, search],
  );

  const revenue = useMemo(
    () => orders.reduce((sum, order) => sum + order.value, 0),
    [orders],
  );
  const awaiting = orders.filter((order) => order.status === "Chờ xác nhận").length;
  const customers = useMemo(
    () =>
      Array.from(
        new Map(
          orders.map((order) => [
            order.email,
            { name: order.customer, email: order.email },
          ]),
        ).values(),
      ),
    [orders],
  );
  const visibleProducts = useMemo(
    () =>
      managedProducts.filter((product) =>
        `${product.name} ${product.category} NOVA-${String(product.id).padStart(4, "0")}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [managedProducts, search],
  );
  const visibleReviews = useMemo(
    () =>
      reviews.filter((review) => {
        const product = managedProducts.find(
          (item) => item.id === review.productId,
        );
        const matchesFilter =
          reviewFilter === "Tất cả" || review.status === reviewFilter;
        const matchesSearch =
          `${review.author} ${review.title} ${review.comment} ${product?.name ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
      }),
    [managedProducts, reviewFilter, reviews, search],
  );
  const pendingReviews = reviews.filter(
    (review) => review.status === "pending",
  ).length;

  const flash = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2200);
  };

  const updateStatus = (id: string, status: OrderStatus) => {
    setOrders((current) =>
      current.map((order) => (order.id === id ? { ...order, status } : order)),
    );
    const localOrders = getOrders();
    if (localOrders.some((order) => order.id === id)) {
      saveOrders(
        localOrders.map((order) =>
          order.id === id ? { ...order, status } : order,
        ),
      );
    }
    flash(`Đã cập nhật đơn #${id} sang “${status}”`);
  };

  const updateStock = (id: number, delta: number) => {
    setStocks((current) => {
      const next = {
        ...current,
        [id]: Math.max(0, (current[id] ?? 0) + delta),
      };
      saveAdminStocks(next);
      return next;
    });
  };

  const toggleProduct = (id: number) => {
    setVisibility((current) => {
      const next = { ...current, [id]: !current[id] };
      saveAdminVisibility(next);
      return next;
    });
    flash("Đã cập nhật trạng thái hiển thị trên trang chủ.");
  };

  const openProductEditor = (product?: Product) => {
    setProductDraft(
      product
        ? { ...product, stock: stocks[product.id] ?? 0 }
        : createProductDraft(),
    );
  };

  const saveProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productDraft) return;
    const product: Product = {
      id: productDraft.id,
      name: productDraft.name.trim(),
      category: productDraft.category.trim(),
      price: Math.max(0, Number(productDraft.price)),
      oldPrice: Math.max(
        Number(productDraft.price),
        Number(productDraft.oldPrice),
      ),
      rating: Math.min(5, Math.max(0, Number(productDraft.rating))),
      sold: productDraft.sold.trim() || "0",
      delivery: Math.max(1, Number(productDraft.delivery)),
      image: productDraft.image.trim(),
      badge: productDraft.badge?.trim() || undefined,
      description: productDraft.description.trim(),
    };
    const exists = managedProducts.some((item) => item.id === product.id);
    const nextProducts = exists
      ? managedProducts.map((item) => (item.id === product.id ? product : item))
      : [product, ...managedProducts];
    const nextStocks = {
      ...stocks,
      [product.id]: Math.max(0, Number(productDraft.stock)),
    };
    const nextVisibility = {
      ...visibility,
      [product.id]: visibility[product.id] ?? true,
    };
    saveManagedProducts(nextProducts);
    saveAdminStocks(nextStocks);
    saveAdminVisibility(nextVisibility);
    setManagedProducts(nextProducts);
    setStocks(nextStocks);
    setVisibility(nextVisibility);
    setProductDraft(null);
    flash(exists ? "Đã lưu thay đổi sản phẩm." : "Đã thêm sản phẩm mới.");
  };

  const deleteProduct = (id: number) => {
    const target = managedProducts.find((product) => product.id === id);
    if (
      !target ||
      !window.confirm(`Xóa “${target.name}” khỏi danh mục trên thiết bị này?`)
    ) {
      return;
    }
    const nextProducts = managedProducts.filter((product) => product.id !== id);
    const nextStocks = { ...stocks };
    const nextVisibility = { ...visibility };
    delete nextStocks[id];
    delete nextVisibility[id];
    saveManagedProducts(nextProducts);
    saveAdminStocks(nextStocks);
    saveAdminVisibility(nextVisibility);
    setManagedProducts(nextProducts);
    setStocks(nextStocks);
    setVisibility(nextVisibility);
    setProductDraft(null);
    flash("Đã xóa sản phẩm. Có thể khôi phục bằng danh mục mặc định.");
  };

  const restoreCatalog = () => {
    if (
      !window.confirm(
        "Khôi phục 10 sản phẩm mẫu và thay thế danh mục đang chỉnh sửa?",
      )
    ) {
      return;
    }
    const restoredStocks = Object.fromEntries(
      products.map((product, index) => [
        product.id,
        index % 4 === 0 ? 8 : 42 + index * 7,
      ]),
    ) as Record<number, number>;
    const restoredVisibility = Object.fromEntries(
      products.map((product) => [product.id, true]),
    ) as Record<number, boolean>;
    saveManagedProducts(products);
    saveAdminStocks(restoredStocks);
    saveAdminVisibility(restoredVisibility);
    setManagedProducts(products);
    setStocks(restoredStocks);
    setVisibility(restoredVisibility);
    flash("Đã khôi phục danh mục mặc định.");
  };

  const addVoucher = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = voucherDraft.code.trim().toUpperCase();
    if (!code) return;
    const voucher: Voucher = {
      code,
      label:
        voucherDraft.label.trim() ||
        `Giảm ${formatPrice(voucherDraft.discount)} cho đơn đủ điều kiện`,
      discount: Math.max(0, Number(voucherDraft.discount)),
      minSubtotal: Math.max(0, Number(voucherDraft.minSubtotal)),
      active: true,
    };
    const exists = vouchers.some((item) => item.code === code);
    const next = exists
      ? vouchers.map((item) => (item.code === code ? voucher : item))
      : [voucher, ...vouchers];
    saveVouchers(next);
    setVoucherState(next);
    setVoucherDraft({
      code: "",
      label: "",
      discount: 50000,
      minSubtotal: 499000,
    });
    flash(exists ? `Đã cập nhật mã ${code}.` : `Đã tạo mã ${code}.`);
  };

  const toggleVoucher = (code: string) => {
    const next = vouchers.map((voucher) =>
      voucher.code === code
        ? { ...voucher, active: !voucher.active }
        : voucher,
    );
    saveVouchers(next);
    setVoucherState(next);
    flash(`Đã cập nhật trạng thái mã ${code}.`);
  };

  const deleteVoucher = (code: string) => {
    if (!window.confirm(`Xóa mã ưu đãi ${code}?`)) return;
    const next = vouchers.filter((voucher) => voucher.code !== code);
    saveVouchers(next);
    setVoucherState(next);
    flash(`Đã xóa mã ${code}.`);
  };

  const moderateReview = (id: string, status: ReviewStatus) => {
    const next = updateReviewStatus(id, status);
    setReviews(next);
    flash(
      status === "approved"
        ? "Đã duyệt và công khai đánh giá."
        : "Đã từ chối hiển thị đánh giá.",
    );
  };

  const removeReview = (id: string) => {
    if (!window.confirm("Xóa vĩnh viễn đánh giá này trên thiết bị?")) return;
    setReviews(deleteReview(id));
    flash("Đã xóa đánh giá.");
  };

  const exportOrders = () => {
    const rows = [
      ["Mã đơn", "Khách hàng", "Email", "Sản phẩm", "Giá trị", "Trạng thái"],
      ...visibleOrders.map((order) => [
        order.id,
        order.customer,
        order.email,
        order.product,
        String(order.value),
        order.status,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `nova-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    flash(`Đã xuất ${visibleOrders.length} đơn hàng.`);
  };

  const logout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    window.location.reload();
  };

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="brand" href="/">
          <span className="brand-mark">N</span>
          <span>
            NOVA<span>seller center</span>
          </span>
        </a>
        <div className="store-switch">
          <span>NS</span>
          <p>
            <b>NOVA Official Store</b>
            <small>Gian hàng chính hãng</small>
          </p>
          <button aria-label="Đổi gian hàng">⌄</button>
        </div>
        <nav>
          <small>TỔNG QUAN</small>
          <button
            className={section === "overview" ? "active" : ""}
            onClick={() => setSection("overview")}
          >
            <span>▦</span>Tổng quan
          </button>
          <button
            className={section === "analytics" ? "active" : ""}
            onClick={() => setSection("analytics")}
          >
            <span>↗</span>Phân tích
          </button>
          <small>VẬN HÀNH</small>
          <button
            className={section === "orders" ? "active" : ""}
            onClick={() => setSection("orders")}
          >
            <span>▤</span>Đơn hàng{awaiting > 0 && <b>{awaiting}</b>}
          </button>
          <button
            className={section === "products" ? "active" : ""}
            onClick={() => setSection("products")}
          >
            <span>□</span>Sản phẩm
          </button>
          <button
            className={section === "promotions" ? "active" : ""}
            onClick={() => setSection("promotions")}
          >
            <span>%</span>Ưu đãi
          </button>
          <button
            className={section === "reviews" ? "active" : ""}
            onClick={() => setSection("reviews")}
          >
            <span>★</span>Đánh giá
            {pendingReviews > 0 && <b>{pendingReviews}</b>}
          </button>
          <button
            className={section === "customers" ? "active" : ""}
            onClick={() => setSection("customers")}
          >
            <span>♙</span>Khách hàng
          </button>
        </nav>
        <a className="back-store" href="/">
          ← Xem gian hàng
        </a>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu" aria-label="Mở menu">☰</button>
          <div className="admin-global-search">
            ⌕
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm đơn hàng hoặc khách hàng..."
            />
          </div>
          <div className="admin-tools">
            <span>LP</span>
            <button className="admin-logout" onClick={logout}>
              Đăng xuất
            </button>
          </div>
        </header>

        {section === "overview" && (
          <div className="admin-content">
            <div className="admin-heading">
              <div>
                <p className="eyebrow">NOVA SELLER CENTER</p>
                <h1>Chào buổi sáng, Long.</h1>
                <p>Dữ liệu đơn mới trên thiết bị này được cập nhật tự động.</p>
              </div>
              <div>
                <button onClick={() => window.print()}>Xuất báo cáo</button>
                <button onClick={() => setSection("orders")}>
                  Xử lý đơn hàng
                </button>
              </div>
            </div>
            <div className="metric-grid">
              <article>
                <p>Doanh thu ghi nhận<span>↗</span></p>
                <strong>{formatPrice(revenue)}</strong>
                <small>Tổng trên {orders.length} đơn đang hiển thị</small>
                <i><span style={{ width: "74%" }} /></i>
              </article>
              <article>
                <p>Đơn chờ xác nhận<span>!</span></p>
                <strong>{awaiting}</strong>
                <small>Cần xử lý trước khi đóng gói</small>
                <i><span style={{ width: `${Math.min(100, awaiting * 22)}%` }} /></i>
              </article>
              <article>
                <p>Khách hàng<span>↗</span></p>
                <strong>{customers.length}</strong>
                <small>Khách hàng duy nhất theo email</small>
                <i><span style={{ width: "68%" }} /></i>
              </article>
              <article>
                <p>Đánh giá gian hàng<span>+0.1</span></p>
                <strong>4.9 <em>★</em></strong>
                <small>96% phản hồi tích cực</small>
                <i><span style={{ width: "96%" }} /></i>
              </article>
            </div>
            <div className="admin-dashboard-grid">
              <article className="revenue-chart">
                <div className="panel-heading">
                  <div><h2>Doanh thu</h2><p>7 ngày gần nhất</p></div>
                </div>
                <div className="bars">
                  {[48, 65, 55, 82, 70, 94, 77].map((height, index) => (
                    <div key={index}>
                      <i style={{ height: `${height - 15}%` }} />
                      <b style={{ height: `${height}%` }} />
                      <small>{["T2", "T3", "T4", "T5", "T6", "T7", "CN"][index]}</small>
                    </div>
                  ))}
                </div>
              </article>
              <article className="attention-panel">
                <div className="panel-heading">
                  <div><h2>Cần xử lý</h2><p>Các việc ưu tiên</p></div>
                  <b>{awaiting + pendingReviews + managedProducts.filter((product) => stocks[product.id] < 10).length}</b>
                </div>
                <button onClick={() => setSection("orders")}>
                  <span className="warn">!</span>
                  <p><b>{awaiting} đơn chờ xác nhận</b><small>Chuyển trạng thái ngay trong bảng đơn</small></p>
                  <em>→</em>
                </button>
                <button onClick={() => setSection("products")}>
                  <span className="danger">↓</span>
                  <p><b>Sản phẩm sắp hết</b><small>Điều chỉnh tồn kho trực tiếp</small></p>
                  <em>→</em>
                </button>
                <button onClick={() => setSection("reviews")}>
                  <span className="info">★</span>
                  <p><b>{pendingReviews} đánh giá chờ duyệt</b><small>Kiểm tra nội dung trước khi công khai</small></p>
                  <em>→</em>
                </button>
              </article>
            </div>
            <article className="recent-orders">
              <div className="panel-heading">
                <div><h2>Đơn hàng gần đây</h2><p>Đơn demo và đơn phát sinh trên thiết bị</p></div>
                <button onClick={() => setSection("orders")}>Xem tất cả →</button>
              </div>
              <OrderTable rows={orders.slice(0, 4)} onStatus={updateStatus} />
            </article>
          </div>
        )}

        {section === "orders" && (
          <div className="admin-content">
            <div className="admin-heading">
              <div>
                <p className="eyebrow">VẬN HÀNH</p>
                <h1>Quản lý đơn hàng</h1>
                <p>Tìm kiếm, lọc và cập nhật trạng thái đơn hàng.</p>
              </div>
              <button onClick={exportOrders}>Xuất CSV</button>
            </div>
            <div className="admin-filters">
              <div className="admin-global-search">
                ⌕
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm mã đơn hoặc khách hàng"
                />
              </div>
              <select
                value={orderFilter}
                onChange={(event) => setOrderFilter(event.target.value)}
              >
                <option>Tất cả</option>
                {statusOptions.map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
            <article className="recent-orders">
              <OrderTable rows={visibleOrders} onStatus={updateStatus} />
            </article>
          </div>
        )}

        {section === "products" && (
          <div className="admin-content">
            <div className="admin-heading">
              <div>
                <p className="eyebrow">KHO HÀNG</p>
                <h1>Sản phẩm</h1>
                <p>Thêm, sửa, xóa, điều chỉnh tồn kho và hiển thị trên gian hàng.</p>
              </div>
              <div>
                <button onClick={restoreCatalog}>Khôi phục mẫu</button>
                <button onClick={() => openProductEditor()}>＋ Thêm sản phẩm</button>
              </div>
            </div>
            <div className="admin-filters">
              <div className="admin-global-search">
                ⌕
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm tên, danh mục hoặc SKU"
                />
              </div>
              <span>{visibleProducts.length} sản phẩm</span>
            </div>
            <div className="admin-product-table">
              <div className="admin-product-head">
                <span>Sản phẩm</span><span>Giá bán</span><span>Tồn kho</span><span>Đã bán</span><span>Kho</span><span>Trang chủ</span><span />
              </div>
              {visibleProducts.map((product) => (
                <div key={product.id}>
                  <span>
                    <img src={product.image} alt="" />
                    <p><b>{product.name}</b><small>SKU: NOVA-{String(product.id).padStart(4, "0")}</small></p>
                  </span>
                  <strong>{formatPrice(product.price)}</strong>
                  <span className="stock-editor">
                    <button onClick={() => updateStock(product.id, -1)}>−</button>
                    <b>{stocks[product.id]}</b>
                    <button onClick={() => updateStock(product.id, 1)}>＋</button>
                  </span>
                  <span>{product.sold}</span>
                  <b className={stocks[product.id] < 10 ? "stock-low" : "stock-ok"}>
                    {stocks[product.id] < 10 ? "Sắp hết" : "Đang bán"}
                  </b>
                  <button
                    className={`product-visibility ${visibility[product.id] ? "active" : ""}`}
                    onClick={() => toggleProduct(product.id)}
                  >
                    {visibility[product.id] ? "Đang hiện" : "Đã ẩn"}
                  </button>
                  <button
                    className="admin-edit-product"
                    onClick={() => openProductEditor(product)}
                  >
                    Chỉnh sửa
                  </button>
                </div>
              ))}
              {visibleProducts.length === 0 && <p className="admin-empty">Không tìm thấy sản phẩm phù hợp.</p>}
            </div>
          </div>
        )}

        {section === "promotions" && (
          <div className="admin-content">
            <div className="admin-heading">
              <div>
                <p className="eyebrow">TĂNG TRƯỞNG</p>
                <h1>Mã ưu đãi</h1>
                <p>Tạo mã giảm giá và bật hoặc tạm dừng áp dụng tại giỏ hàng.</p>
              </div>
            </div>
            <div className="promotion-layout">
              <form className="voucher-creator" onSubmit={addVoucher}>
                <div>
                  <p className="eyebrow">TẠO MÃ MỚI</p>
                  <h2>Thiết lập ưu đãi</h2>
                </div>
                <label>
                  Mã voucher
                  <input
                    required
                    maxLength={20}
                    value={voucherDraft.code}
                    onChange={(event) =>
                      setVoucherDraft((current) => ({
                        ...current,
                        code: event.target.value.toUpperCase().replaceAll(" ", ""),
                      }))
                    }
                    placeholder="VD: SUMMER100"
                  />
                </label>
                <label>
                  Mô tả ngắn
                  <input
                    value={voucherDraft.label}
                    onChange={(event) =>
                      setVoucherDraft((current) => ({
                        ...current,
                        label: event.target.value,
                      }))
                    }
                    placeholder="Giảm 100.000đ cho đơn mùa hè"
                  />
                </label>
                <div className="two-col">
                  <label>
                    Số tiền giảm
                    <input
                      required
                      min="0"
                      step="1000"
                      type="number"
                      value={voucherDraft.discount}
                      onChange={(event) =>
                        setVoucherDraft((current) => ({
                          ...current,
                          discount: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label>
                    Đơn tối thiểu
                    <input
                      required
                      min="0"
                      step="1000"
                      type="number"
                      value={voucherDraft.minSubtotal}
                      onChange={(event) =>
                        setVoucherDraft((current) => ({
                          ...current,
                          minSubtotal: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                </div>
                <button className="primary-submit">Tạo hoặc cập nhật mã</button>
                <small>
                  Dữ liệu ưu đãi được lưu trên trình duyệt của bản demo này.
                </small>
              </form>
              <section className="voucher-list">
                <div>
                  <p className="eyebrow">ĐANG QUẢN LÝ</p>
                  <h2>{vouchers.length} mã ưu đãi</h2>
                </div>
                {vouchers.map((voucher) => (
                  <article key={voucher.code}>
                    <div className="voucher-ticket">
                      <span>%</span>
                      <p>
                        <b>{voucher.code}</b>
                        <small>{voucher.label}</small>
                      </p>
                    </div>
                    <div className="voucher-values">
                      <span>
                        Giảm <b>{formatPrice(voucher.discount)}</b>
                      </span>
                      <span>
                        Đơn từ <b>{formatPrice(voucher.minSubtotal)}</b>
                      </span>
                    </div>
                    <div className="voucher-actions">
                      <button
                        className={`product-visibility ${voucher.active ? "active" : ""}`}
                        onClick={() => toggleVoucher(voucher.code)}
                      >
                        {voucher.active ? "Đang bật" : "Tạm dừng"}
                      </button>
                      <button onClick={() => deleteVoucher(voucher.code)}>
                        Xóa
                      </button>
                    </div>
                  </article>
                ))}
                {vouchers.length === 0 && (
                  <p className="admin-empty">
                    Chưa có mã ưu đãi. Tạo mã đầu tiên ở biểu mẫu bên cạnh.
                  </p>
                )}
              </section>
            </div>
          </div>
        )}

        {section === "reviews" && (
          <div className="admin-content">
            <div className="admin-heading">
              <div>
                <p className="eyebrow">UY TÍN GIAN HÀNG</p>
                <h1>Kiểm duyệt đánh giá</h1>
                <p>Duyệt nội dung khách hàng trước khi hiển thị trên trang sản phẩm.</p>
              </div>
            </div>
            <div className="review-admin-metrics">
              <article>
                <span>Chờ duyệt</span>
                <strong>{pendingReviews}</strong>
              </article>
              <article>
                <span>Đang hiển thị</span>
                <strong>
                  {reviews.filter((review) => review.status === "approved").length}
                </strong>
              </article>
              <article>
                <span>Điểm trung bình</span>
                <strong>
                  {reviews.length
                    ? (
                        reviews.reduce(
                          (sum, review) => sum + review.rating,
                          0,
                        ) / reviews.length
                      ).toFixed(1)
                    : "—"}{" "}
                  <em>★</em>
                </strong>
              </article>
            </div>
            <div className="admin-filters">
              <div className="admin-global-search">
                ⌕
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm khách hàng, sản phẩm hoặc nội dung"
                />
              </div>
              <select
                value={reviewFilter}
                onChange={(event) => setReviewFilter(event.target.value)}
              >
                <option value="Tất cả">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Đã từ chối</option>
              </select>
            </div>
            <section className="admin-review-list">
              {visibleReviews.map((review) => {
                const product = managedProducts.find(
                  (item) => item.id === review.productId,
                );
                const statusLabel =
                  review.status === "approved"
                    ? "Đã duyệt"
                    : review.status === "rejected"
                      ? "Đã từ chối"
                      : "Chờ duyệt";
                return (
                  <article key={review.id}>
                    <div className="admin-review-product">
                      {product ? (
                        <img src={product.image} alt="" />
                      ) : (
                        <span>◇</span>
                      )}
                      <p>
                        <b>{product?.name ?? "Sản phẩm đã xóa"}</b>
                        <small>#{review.id}</small>
                      </p>
                    </div>
                    <div className="admin-review-copy">
                      <header>
                        <div>
                          <b>{review.author}</b>
                          {review.verifiedPurchase && (
                            <span>✓ Đã mua hàng</span>
                          )}
                        </div>
                        <time>
                          {new Intl.DateTimeFormat("vi-VN").format(
                            new Date(review.createdAt),
                          )}
                        </time>
                      </header>
                      <p className="review-stars">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </p>
                      <h3>{review.title}</h3>
                      <p>{review.comment}</p>
                    </div>
                    <div className="admin-review-actions">
                      <b className={`review-status ${review.status}`}>
                        {statusLabel}
                      </b>
                      {review.status !== "approved" && (
                        <button
                          onClick={() =>
                            moderateReview(review.id, "approved")
                          }
                        >
                          Duyệt
                        </button>
                      )}
                      {review.status !== "rejected" && (
                        <button
                          onClick={() =>
                            moderateReview(review.id, "rejected")
                          }
                        >
                          Từ chối
                        </button>
                      )}
                      <button onClick={() => removeReview(review.id)}>
                        Xóa
                      </button>
                    </div>
                  </article>
                );
              })}
              {visibleReviews.length === 0 && (
                <p className="admin-empty">
                  Không có đánh giá phù hợp với bộ lọc hiện tại.
                </p>
              )}
            </section>
          </div>
        )}

        {section === "analytics" && (
          <div className="admin-content">
            <div className="admin-heading">
              <div><p className="eyebrow">HIỆU QUẢ</p><h1>Phân tích kinh doanh</h1><p>Tổng hợp trực tiếp từ danh sách đơn đang hiển thị.</p></div>
            </div>
            <div className="analytics-grid">
              <article><span>Giá trị đơn trung bình</span><strong>{formatPrice(orders.length ? revenue / orders.length : 0)}</strong></article>
              <article><span>Tỷ lệ hoàn tất</span><strong>{Math.round((orders.filter((order) => order.status === "Hoàn tất").length / Math.max(1, orders.length)) * 100)}%</strong></article>
              <article><span>Sản phẩm đang bán</span><strong>{managedProducts.length}</strong></article>
            </div>
          </div>
        )}

        {section === "customers" && (
          <div className="admin-content">
            <div className="admin-heading">
              <div><p className="eyebrow">CRM</p><h1>Khách hàng</h1><p>Danh sách khách phát sinh từ các đơn hàng.</p></div>
            </div>
            <div className="customer-table">
              <div><b>Khách hàng</b><b>Email</b><b>Số đơn</b><b>Tổng chi tiêu</b></div>
              {customers.map((customer) => {
                const customerOrders = orders.filter((order) => order.email === customer.email);
                return (
                  <div key={customer.email}>
                    <strong>{customer.name}</strong>
                    <span>{customer.email}</span>
                    <span>{customerOrders.length}</span>
                    <b>{formatPrice(customerOrders.reduce((sum, order) => sum + order.value, 0))}</b>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
      {productDraft && (
        <div
          className="modal-backdrop admin-editor-backdrop"
          onMouseDown={() => setProductDraft(null)}
        >
          <form
            className="admin-product-editor"
            onSubmit={saveProduct}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p className="eyebrow">DANH MỤC SẢN PHẨM</p>
                <h2>
                  {managedProducts.some(
                    (product) => product.id === productDraft.id,
                  )
                    ? "Chỉnh sửa sản phẩm"
                    : "Thêm sản phẩm mới"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setProductDraft(null)}
              >
                ×
              </button>
            </header>
            <div className="admin-editor-grid">
              <div className="admin-product-preview">
                <img src={productDraft.image} alt="" />
                <p>
                  <b>{productDraft.name || "Tên sản phẩm"}</b>
                  <span>{formatPrice(productDraft.price)}</span>
                  <small>Kho: {productDraft.stock}</small>
                </p>
              </div>
              <div className="admin-editor-fields">
                <label>
                  Tên sản phẩm
                  <input
                    required
                    value={productDraft.name}
                    onChange={(event) =>
                      setProductDraft((current) =>
                        current
                          ? { ...current, name: event.target.value }
                          : current,
                      )
                    }
                    placeholder="Tên hiển thị trên cửa hàng"
                  />
                </label>
                <div className="two-col">
                  <label>
                    Danh mục
                    <input
                      required
                      value={productDraft.category}
                      onChange={(event) =>
                        setProductDraft((current) =>
                          current
                            ? { ...current, category: event.target.value }
                            : current,
                        )
                      }
                      list="nova-categories"
                    />
                    <datalist id="nova-categories">
                      {Array.from(
                        new Set([
                          "Điện tử",
                          "Thời trang",
                          "Làm đẹp",
                          "Nhà cửa",
                          "Phụ kiện",
                          ...managedProducts.map(
                            (product) => product.category,
                          ),
                        ]),
                      ).map((category) => (
                        <option value={category} key={category} />
                      ))}
                    </datalist>
                  </label>
                  <label>
                    Nhãn nổi bật
                    <input
                      value={productDraft.badge ?? ""}
                      onChange={(event) =>
                        setProductDraft((current) =>
                          current
                            ? { ...current, badge: event.target.value }
                            : current,
                        )
                      }
                      placeholder="MỚI, BÁN CHẠY..."
                    />
                  </label>
                </div>
                <div className="three-col">
                  <label>
                    Giá bán
                    <input
                      required
                      min="0"
                      type="number"
                      value={productDraft.price}
                      onChange={(event) =>
                        setProductDraft((current) =>
                          current
                            ? { ...current, price: Number(event.target.value) }
                            : current,
                        )
                      }
                    />
                  </label>
                  <label>
                    Giá gốc
                    <input
                      required
                      min="0"
                      type="number"
                      value={productDraft.oldPrice}
                      onChange={(event) =>
                        setProductDraft((current) =>
                          current
                            ? { ...current, oldPrice: Number(event.target.value) }
                            : current,
                        )
                      }
                    />
                  </label>
                  <label>
                    Tồn kho
                    <input
                      required
                      min="0"
                      type="number"
                      value={productDraft.stock}
                      onChange={(event) =>
                        setProductDraft((current) =>
                          current
                            ? { ...current, stock: Number(event.target.value) }
                            : current,
                        )
                      }
                    />
                  </label>
                </div>
                <div className="three-col">
                  <label>
                    Đánh giá
                    <input
                      required
                      max="5"
                      min="0"
                      step="0.1"
                      type="number"
                      value={productDraft.rating}
                      onChange={(event) =>
                        setProductDraft((current) =>
                          current
                            ? { ...current, rating: Number(event.target.value) }
                            : current,
                        )
                      }
                    />
                  </label>
                  <label>
                    Đã bán
                    <input
                      required
                      value={productDraft.sold}
                      onChange={(event) =>
                        setProductDraft((current) =>
                          current
                            ? { ...current, sold: event.target.value }
                            : current,
                        )
                      }
                    />
                  </label>
                  <label>
                    Giao trong (ngày)
                    <input
                      required
                      min="1"
                      type="number"
                      value={productDraft.delivery}
                      onChange={(event) =>
                        setProductDraft((current) =>
                          current
                            ? {
                                ...current,
                                delivery: Number(event.target.value),
                              }
                            : current,
                        )
                      }
                    />
                  </label>
                </div>
                <label>
                  URL hình ảnh
                  <input
                    required
                    type="url"
                    value={productDraft.image}
                    onChange={(event) =>
                      setProductDraft((current) =>
                        current
                          ? { ...current, image: event.target.value }
                          : current,
                      )
                    }
                  />
                </label>
                <label>
                  Mô tả sản phẩm
                  <textarea
                    required
                    rows={4}
                    value={productDraft.description}
                    onChange={(event) =>
                      setProductDraft((current) =>
                        current
                          ? { ...current, description: event.target.value }
                          : current,
                      )
                    }
                    placeholder="Mô tả ngắn gọn lợi ích và đặc điểm nổi bật"
                  />
                </label>
              </div>
            </div>
            <footer>
              {managedProducts.some(
                (product) => product.id === productDraft.id,
              ) && (
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => deleteProduct(productDraft.id)}
                >
                  Xóa sản phẩm
                </button>
              )}
              <div>
                <button type="button" onClick={() => setProductDraft(null)}>
                  Hủy
                </button>
                <button type="submit">Lưu và đồng bộ</button>
              </div>
            </footer>
          </form>
        </div>
      )}
      {notice && <div className="toast"><span>✓</span>{notice}</div>}
    </main>
  );
}

function OrderTable({
  rows,
  onStatus,
}: {
  rows: AdminOrder[];
  onStatus: (id: string, status: OrderStatus) => void;
}) {
  return (
    <div className="order-table">
      <div><span>Đơn hàng</span><span>Khách hàng</span><span>Sản phẩm</span><span>Giá trị</span><span>Trạng thái</span><span /></div>
      {rows.map((order) => (
        <div key={`${order.id}-${order.email}`}>
          <span><b>#{order.id}</b><small>{order.time}</small></span>
          <span>{order.customer}<small>{order.email}</small></span>
          <span>{order.product}</span>
          <strong>{formatPrice(order.value)}</strong>
          <span>
            <select
              className={`order-status status-${order.status.replaceAll(" ", "-").toLowerCase()}`}
              value={order.status}
              onChange={(event) => onStatus(order.id, event.target.value as OrderStatus)}
            >
              {statusOptions.map((status) => <option key={status}>{status}</option>)}
            </select>
          </span>
          <span>{order.local ? "Mới" : "Demo"}</span>
        </div>
      ))}
      {rows.length === 0 && <p className="admin-empty">Không có đơn hàng phù hợp.</p>}
    </div>
  );
}
