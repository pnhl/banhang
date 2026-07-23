"use client";

import { useMemo, useState } from "react";
import { formatPrice, products } from "../lib/catalog";

const orders = [
  { id: "#NV240726", customer: "Minh Anh", product: "NovaSound Air", value: 1290000, status: "Chờ xác nhận", time: "10 phút trước" },
  { id: "#NV240725", customer: "Hoàng Nam", product: "Cloud Walk", value: 1378000, status: "Đang giao", time: "35 phút trước" },
  { id: "#NV240724", customer: "Thùy Dương", product: "Dew Lab", value: 459000, status: "Hoàn tất", time: "1 giờ trước" },
  { id: "#NV240723", customer: "Quốc Bảo", product: "Studio 75", value: 1490000, status: "Đang đóng gói", time: "2 giờ trước" },
  { id: "#NV240722", customer: "Hà My", product: "Halo Touch", value: 798000, status: "Hoàn tất", time: "3 giờ trước" },
];

export default function AdminPage() {
  const [section, setSection] = useState("overview");
  const [orderFilter, setOrderFilter] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const visibleOrders = orders.filter((order) => (orderFilter === "Tất cả" || order.status === orderFilter) && `${order.id} ${order.customer}`.toLowerCase().includes(search.toLowerCase()));
  const revenue = useMemo(() => orders.reduce((sum, order) => sum + order.value, 0), []);

  const flash = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2200);
  };

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="brand" href="/"><span className="brand-mark">N</span><span>NOVA<span>seller center</span></span></a>
        <div className="store-switch"><span>NS</span><p><b>NOVA Official Store</b><small>Gian hàng chính hãng</small></p><button>⌄</button></div>
        <nav>
          <small>TỔNG QUAN</small>
          <button className={section === "overview" ? "active" : ""} onClick={() => setSection("overview")}><span>▦</span>Tổng quan</button>
          <button className={section === "analytics" ? "active" : ""} onClick={() => setSection("analytics")}><span>↗</span>Phân tích</button>
          <small>VẬN HÀNH</small>
          <button className={section === "orders" ? "active" : ""} onClick={() => setSection("orders")}><span>▤</span>Đơn hàng<b>12</b></button>
          <button className={section === "products" ? "active" : ""} onClick={() => setSection("products")}><span>□</span>Sản phẩm</button>
          <button className={section === "customers" ? "active" : ""} onClick={() => setSection("customers")}><span>♙</span>Khách hàng</button>
          <small>TĂNG TRƯỞNG</small>
          <button onClick={() => flash("Chiến dịch khuyến mãi đang được chuẩn bị")}><span>✦</span>Khuyến mãi</button>
          <button onClick={() => flash("Trung tâm quảng cáo đang được chuẩn bị")}><span>◎</span>Quảng cáo</button>
        </nav>
        <a className="back-store" href="/">← Xem gian hàng</a>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar"><button className="admin-menu">☰</button><div className="admin-global-search">⌕<input placeholder="Tìm đơn hàng, sản phẩm, khách hàng..." /></div><div className="admin-tools"><button>?</button><button>♢<b>3</b></button><span>LP</span></div></header>

        {section === "overview" && <div className="admin-content">
          <div className="admin-heading"><div><p className="eyebrow">THỨ SÁU, 24 THÁNG 7</p><h1>Chào buổi sáng, Long.</h1><p>Gian hàng đang vận hành tốt. Đây là những gì cần chú ý hôm nay.</p></div><div><button onClick={() => flash("Đang chuẩn bị báo cáo tháng 7")}>Xuất báo cáo</button><button onClick={() => setSection("products")}>＋ Thêm sản phẩm</button></div></div>
          <div className="metric-grid">
            <article><p>Doanh thu hôm nay<span>↗ 12.4%</span></p><strong>{formatPrice(revenue)}</strong><small>So với 4.830.000đ hôm qua</small><i><span style={{ width: "74%" }}></span></i></article>
            <article><p>Đơn hàng mới<span>↗ 8.2%</span></p><strong>48</strong><small>12 đơn đang chờ xác nhận</small><i><span style={{ width: "61%" }}></span></i></article>
            <article><p>Lượt truy cập<span>↗ 18.7%</span></p><strong>2.847</strong><small>Tỷ lệ chuyển đổi 3,8%</small><i><span style={{ width: "82%" }}></span></i></article>
            <article><p>Đánh giá gian hàng<span>+0.1</span></p><strong>4.9 <em>★</em></strong><small>96% phản hồi tích cực</small><i><span style={{ width: "96%" }}></span></i></article>
          </div>
          <div className="admin-dashboard-grid">
            <article className="revenue-chart"><div className="panel-heading"><div><h2>Doanh thu</h2><p>7 ngày gần nhất</p></div><select><option>7 ngày</option><option>30 ngày</option></select></div><div className="chart-legend"><span><i></i>Tuần này</span><span><i></i>Tuần trước</span></div><div className="bars">{[48,65,55,82,70,94,77].map((height, index) => <div key={index}><i style={{ height: `${height - 15}%` }}></i><b style={{ height: `${height}%` }}></b><small>{["T2","T3","T4","T5","T6","T7","CN"][index]}</small></div>)}</div></article>
            <article className="attention-panel"><div className="panel-heading"><div><h2>Cần xử lý</h2><p>Các việc ưu tiên hôm nay</p></div><b>4</b></div><button onClick={() => setSection("orders")}><span className="warn">!</span><p><b>12 đơn chờ xác nhận</b><small>Cũ nhất từ 2 giờ trước</small></p><em>→</em></button><button onClick={() => setSection("products")}><span className="danger">↓</span><p><b>3 sản phẩm sắp hết</b><small>Tồn kho dưới 10 sản phẩm</small></p><em>→</em></button><button onClick={() => flash("Đã mở hộp thư khách hàng")}><span className="info">✉</span><p><b>5 tin nhắn chưa đọc</b><small>Thời gian phản hồi TB: 8 phút</small></p><em>→</em></button><button onClick={() => flash("Đã mở mục đánh giá")}><span className="success">★</span><p><b>8 đánh giá mới</b><small>Điểm trung bình 4,9</small></p><em>→</em></button></article>
          </div>
          <article className="recent-orders"><div className="panel-heading"><div><h2>Đơn hàng gần đây</h2><p>Cập nhật theo thời gian thực</p></div><button onClick={() => setSection("orders")}>Xem tất cả →</button></div><OrderTable rows={orders.slice(0, 4)} /></article>
        </div>}

        {section === "orders" && <div className="admin-content"><div className="admin-heading"><div><p className="eyebrow">VẬN HÀNH</p><h1>Quản lý đơn hàng</h1><p>Theo dõi và xử lý đơn hàng từ mọi kênh bán.</p></div><button onClick={() => flash("Đã xuất danh sách đơn hàng")}>Xuất danh sách</button></div><div className="admin-filters"><div className="admin-global-search">⌕<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã đơn hoặc khách hàng" /></div><select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)}><option>Tất cả</option><option>Chờ xác nhận</option><option>Đang đóng gói</option><option>Đang giao</option><option>Hoàn tất</option></select></div><article className="recent-orders"><OrderTable rows={visibleOrders} /></article></div>}

        {section === "products" && <div className="admin-content"><div className="admin-heading"><div><p className="eyebrow">KHO HÀNG</p><h1>Sản phẩm</h1><p>Quản lý danh mục, giá bán và tồn kho.</p></div><button onClick={() => flash("Biểu mẫu thêm sản phẩm đang ở chế độ demo")}>＋ Thêm sản phẩm</button></div><div className="admin-product-table"><div className="admin-product-head"><span>Sản phẩm</span><span>Giá bán</span><span>Tồn kho</span><span>Đã bán</span><span>Trạng thái</span></div>{products.map((product, index) => <div key={product.id}><span><img src={product.image} alt="" /><p><b>{product.name}</b><small>SKU: NOVA-{String(product.id).padStart(4,"0")}</small></p></span><strong>{formatPrice(product.price)}</strong><span>{index % 4 === 0 ? 8 : 42 + index * 7}</span><span>{product.sold}</span><b className={index % 4 === 0 ? "stock-low" : "stock-ok"}>{index % 4 === 0 ? "Sắp hết" : "Đang bán"}</b></div>)}</div></div>}

        {(section === "analytics" || section === "customers") && <div className="admin-content"><div className="admin-heading"><div><p className="eyebrow">NOVA SELLER CENTER</p><h1>{section === "analytics" ? "Phân tích kinh doanh" : "Khách hàng"}</h1><p>{section === "analytics" ? "Theo dõi hiệu quả bán hàng và hành vi mua sắm." : "Quản lý quan hệ và phân nhóm khách hàng."}</p></div></div><div className="admin-placeholder"><span>{section === "analytics" ? "↗" : "♙"}</span><h2>{section === "analytics" ? "Báo cáo chuyên sâu đang được tổng hợp" : "12.480 khách hàng đã kết nối"}</h2><p>Dữ liệu mẫu minh họa cách khu vực này hoạt động khi kết nối hệ thống bán hàng thật.</p><button onClick={() => setSection("overview")}>Quay về tổng quan</button></div></div>}
      </section>
      {notice && <div className="toast"><span>✓</span>{notice}</div>}
    </main>
  );
}

function OrderTable({ rows }: { rows: typeof orders }) {
  return <div className="order-table"><div><span>Đơn hàng</span><span>Khách hàng</span><span>Sản phẩm</span><span>Giá trị</span><span>Trạng thái</span><span></span></div>{rows.map((order) => <div key={order.id}><span><b>{order.id}</b><small>{order.time}</small></span><span>{order.customer}</span><span>{order.product}</span><strong>{formatPrice(order.value)}</strong><span><b className={`order-status status-${order.status.replaceAll(" ","-").toLowerCase()}`}>{order.status}</b></span><button>•••</button></div>)}</div>;
}
