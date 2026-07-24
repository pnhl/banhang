"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getOrders,
  NovaOrder,
  OrderStatus,
  saveOrders,
} from "../lib/account";
import { formatPrice, products } from "../lib/catalog";

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
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>(seededOrders);
  const [stocks, setStocks] = useState<Record<number, number>>(() =>
    Object.fromEntries(products.map((product, index) => [product.id, index % 4 === 0 ? 8 : 42 + index * 7])),
  );
  const [visibility, setVisibility] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(products.map((product) => [product.id, true])),
  );

  useEffect(() => {
    const sync = () => {
      const localOrders = getOrders().map(toAdminOrder);
      setOrders([...localOrders, ...seededOrders]);
    };
    sync();
    try {
      const savedStocks = window.localStorage.getItem("nova-admin-stocks");
      const savedVisibility = window.localStorage.getItem("nova-admin-visibility");
      if (savedStocks) setStocks(JSON.parse(savedStocks));
      if (savedVisibility) setVisibility(JSON.parse(savedVisibility));
    } catch {
      // Keep the seeded demo inventory when browser data is unavailable.
    }
    window.addEventListener("nova-orders-updated", sync);
    return () => window.removeEventListener("nova-orders-updated", sync);
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
      products.filter((product) =>
        `${product.name} ${product.category} NOVA-${String(product.id).padStart(4, "0")}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [search],
  );

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
      window.localStorage.setItem("nova-admin-stocks", JSON.stringify(next));
      return next;
    });
  };

  const toggleProduct = (id: number) => {
    setVisibility((current) => {
      const next = { ...current, [id]: !current[id] };
      window.localStorage.setItem(
        "nova-admin-visibility",
        JSON.stringify(next),
      );
      return next;
    });
    flash("Đã cập nhật trạng thái hiển thị trên trang chủ.");
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
                  <b>{awaiting + products.filter((product) => stocks[product.id] < 10).length}</b>
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
                <p>Tìm kiếm, điều chỉnh tồn kho và hiển thị trên trang chủ.</p>
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
                <span>Sản phẩm</span><span>Giá bán</span><span>Tồn kho</span><span>Đã bán</span><span>Kho</span><span>Trang chủ</span>
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
                </div>
              ))}
              {visibleProducts.length === 0 && <p className="admin-empty">Không tìm thấy sản phẩm phù hợp.</p>}
            </div>
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
              <article><span>Sản phẩm đang bán</span><strong>{products.length}</strong></article>
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
