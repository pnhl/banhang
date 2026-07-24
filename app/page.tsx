"use client";

import { useEffect, useMemo, useState } from "react";
import { getWishlistIds, toggleWishlist } from "./lib/account";

type Product = {
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

type CartLine = Product & { quantity: number };

const products: Product[] = [
  {
    id: 1,
    name: "Tai nghe chụp tai NovaSound Air",
    category: "Điện tử",
    price: 1290000,
    oldPrice: 1790000,
    rating: 4.9,
    sold: "2,1k",
    delivery: 2,
    badge: "BÁN CHẠY",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
    description: "Chống ồn chủ động, pin 48 giờ và đệm tai memory foam êm ái cho cả ngày dài.",
  },
  {
    id: 2,
    name: "Giày sneaker Cloud Walk",
    category: "Thời trang",
    price: 689000,
    oldPrice: 990000,
    rating: 4.8,
    sold: "5,8k",
    delivery: 1,
    badge: "GIẢM 30%",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
    description: "Đế foam siêu nhẹ, phom ôm chân và chất liệu thoáng khí dành cho nhịp sống năng động.",
  },
  {
    id: 3,
    name: "Đồng hồ tối giản Mono 36",
    category: "Phụ kiện",
    price: 849000,
    oldPrice: 1200000,
    rating: 4.7,
    sold: "980",
    delivery: 3,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85",
    description: "Mặt kính sapphire, dây da thật và thiết kế thanh lịch phù hợp mọi phong cách.",
  },
  {
    id: 4,
    name: "Máy ảnh compact Pocket C1",
    category: "Điện tử",
    price: 3890000,
    oldPrice: 4590000,
    rating: 4.9,
    sold: "438",
    delivery: 2,
    badge: "MỚI",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=85",
    description: "Cảm biến 24MP, quay 4K và kết nối nhanh với điện thoại cho những chuyến đi.",
  },
  {
    id: 5,
    name: "Ghế thư giãn Nordic Lounge",
    category: "Nhà cửa",
    price: 2190000,
    oldPrice: 2800000,
    rating: 4.6,
    sold: "721",
    delivery: 4,
    image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=85",
    description: "Khung gỗ sồi chắc chắn, đường cong công thái học và đệm vải chống bám bụi.",
  },
  {
    id: 6,
    name: "Tinh chất phục hồi Dew Lab",
    category: "Làm đẹp",
    price: 459000,
    oldPrice: 620000,
    rating: 4.9,
    sold: "3,4k",
    delivery: 1,
    badge: "FREESHIP",
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=85",
    description: "Công thức 5% niacinamide cùng peptide giúp cấp ẩm và củng cố hàng rào bảo vệ da.",
  },
  {
    id: 7,
    name: "Balo laptop Urban Day 16”",
    category: "Phụ kiện",
    price: 569000,
    oldPrice: 790000,
    rating: 4.8,
    sold: "1,7k",
    delivery: 2,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85",
    description: "Chống thấm nhẹ, ngăn laptop chống sốc và hệ thống quai đeo phân tán lực.",
  },
  {
    id: 8,
    name: "Điện thoại Nova X Lite 5G",
    category: "Điện tử",
    price: 6490000,
    oldPrice: 7290000,
    rating: 4.7,
    sold: "860",
    delivery: 2,
    badge: "TRẢ GÓP 0%",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa?auto=format&fit=crop&w=900&q=85",
    description: "Màn hình OLED 120Hz, camera AI 50MP và kết nối 5G mạnh mẽ.",
  },
  {
    id: 9,
    name: "Bàn phím cơ Studio 75",
    category: "Điện tử",
    price: 1490000,
    oldPrice: 1890000,
    rating: 4.9,
    sold: "1,2k",
    delivery: 1,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85",
    description: "Layout 75%, switch linear êm, kết nối ba chế độ và keycap PBT bền màu.",
  },
  {
    id: 10,
    name: "Đèn bàn Halo Touch",
    category: "Nhà cửa",
    price: 399000,
    oldPrice: 550000,
    rating: 4.6,
    sold: "2,6k",
    delivery: 3,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85",
    description: "Ba nhiệt độ màu, điều khiển cảm ứng và chế độ bảo vệ mắt khi làm việc.",
  },
];

const categoryIcons: Record<string, string> = {
  "Điện tử": "◈",
  "Thời trang": "✦",
  "Làm đẹp": "✿",
  "Nhà cửa": "⌂",
  "Phụ kiện": "◇",
  "Voucher": "%",
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [sort, setSort] = useState("popular");
  const [maxPrice, setMaxPrice] = useState(7000000);
  const [minRating, setMinRating] = useState(0);
  const [delivery, setDelivery] = useState(5);
  const [selected, setSelected] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [liked, setLiked] = useState<number[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem("nova-cart");
    if (saved) setCart(JSON.parse(saved));
    const initialQuery = new URLSearchParams(window.location.search).get("q");
    if (initialQuery) setQuery(initialQuery);
    setLiked(getWishlistIds());
  }, []);

  useEffect(() => {
    window.localStorage.setItem("nova-cart", JSON.stringify(cart));
  }, [cart]);

  const filtered = useMemo(() => {
    const result = products.filter(
      (product) =>
        (category === "Tất cả" || product.category === category) &&
        product.name.toLowerCase().includes(query.toLowerCase()) &&
        product.price <= maxPrice &&
        product.rating >= minRating &&
        product.delivery <= delivery,
    );
    if (sort === "price-low") return [...result].sort((a, b) => a.price - b.price);
    if (sort === "price-high") return [...result].sort((a, b) => b.price - a.price);
    if (sort === "rating") return [...result].sort((a, b) => b.rating - a.rating);
    return result;
  }, [category, delivery, maxPrice, minRating, query, sort]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
    setToast(`Đã thêm “${product.name}” vào giỏ`);
    window.setTimeout(() => setToast(""), 2400);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const chooseCategory = (value: string) => {
    setCategory(value);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#top" aria-label="NOVA Market - Trang chủ">
            <span className="brand-mark">N</span>
            <span>NOVA<span>market</span></span>
          </a>
          <div className="search-shell">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Tìm kiếm sản phẩm"
              placeholder="Bạn đang tìm gì hôm nay?"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}>
              Tìm kiếm
            </button>
          </div>
          <nav className="header-actions" aria-label="Tiện ích">
            <a href="/wishlist"><span>♡</span><small>Yêu thích</small>{liked.length > 0 && <b>{liked.length}</b>}</a>
            <a href="/account"><span>♙</span><small>Tài khoản</small></a>
            <a href="/cart" className="cart-button">
              <span>▱</span><small>Giỏ hàng</small>
              {totalItems > 0 && <b>{totalItems}</b>}
            </a>
          </nav>
        </div>
        <div className="quick-links">
          <div>
            <span>Gợi ý:</span>
            <button onClick={() => setQuery("Tai nghe")}>Tai nghe</button>
            <button onClick={() => setQuery("Giày")}>Sneaker</button>
            <button onClick={() => setQuery("Đèn")}>Đèn bàn</button>
            <button onClick={() => setQuery("Balo")}>Balo laptop</button>
          </div>
          <p>Giao nhanh 2H tại nội thành</p>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">NOVA SALE · 24–28.07</p>
          <h1>Món hay mỗi ngày.<br /><em>Giá nhẹ tênh.</em></h1>
          <p>Chọn hàng chất, săn ưu đãi thật và nhận tận tay nhanh hơn bạn nghĩ.</p>
          <div className="hero-cta">
            <button onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}>Săn deal ngay <span>→</span></button>
            <span>Đã có <strong>12.000+</strong> người mua hôm nay</span>
          </div>
          <div className="trust-row">
            <span>✓ Đổi trả 15 ngày</span>
            <span>✓ Thanh toán bảo mật</span>
            <span>✓ Shop đã xác thực</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="Sản phẩm nổi bật">
          <div className="sun-disc"></div>
          <img
            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=90"
            alt="Tai nghe NovaSound Air màu đen"
          />
          <div className="hero-price">
            <small>Deal độc quyền</small>
            <strong>1.290K</strong>
            <del>1.790K</del>
          </div>
          <div className="floating-note">48H<br /><span>PIN</span></div>
        </div>
      </section>

      <section className="categories wrap" aria-label="Danh mục sản phẩm">
        {["Điện tử", "Thời trang", "Làm đẹp", "Nhà cửa", "Phụ kiện", "Voucher"].map((item) => (
          <button key={item} onClick={() => chooseCategory(item === "Voucher" ? "Tất cả" : item)}>
            <span>{categoryIcons[item]}</span>
            <b>{item}</b>
            <small>{item === "Voucher" ? "Ưu đãi hôm nay" : `${products.filter((p) => p.category === item).length * 120}+ sản phẩm`}</small>
          </button>
        ))}
      </section>

      <section className="deal-strip wrap">
        <div>
          <span className="live-dot"></span>
          <p><b>Deal chớp nhoáng</b><small>Kết thúc trong</small></p>
          <div className="timer"><span>02</span>:<span>18</span>:<span>44</span></div>
        </div>
        <p>Mã <strong>NOVA50</strong> giảm thêm 50K cho đơn từ 499K</p>
        <button onClick={() => setMaxPrice(1500000)}>Xem tất cả deal →</button>
      </section>

      <section className="shop-section wrap" id="products">
        <aside className="filters">
          <div className="filter-heading">
            <h2>Bộ lọc</h2>
            <button onClick={() => { setCategory("Tất cả"); setMaxPrice(7000000); setMinRating(0); setDelivery(5); }}>Đặt lại</button>
          </div>
          <div className="filter-group">
            <h3>Danh mục</h3>
            {["Tất cả", "Điện tử", "Thời trang", "Làm đẹp", "Nhà cửa", "Phụ kiện"].map((item) => (
              <label key={item}>
                <input type="radio" name="category" checked={category === item} onChange={() => setCategory(item)} />
                <span>{item}</span>
              </label>
            ))}
          </div>
          <div className="filter-group">
            <h3>Khoảng giá</h3>
            <input
              className="range"
              type="range"
              min="400000"
              max="7000000"
              step="100000"
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
              aria-label="Giá tối đa"
            />
            <div className="range-label"><span>0đ</span><b>{formatPrice(maxPrice)}</b></div>
          </div>
          <div className="filter-group">
            <h3>Đánh giá</h3>
            {[4.8, 4.7, 4.5].map((value) => (
              <label key={value}>
                <input type="radio" name="rating" checked={minRating === value} onChange={() => setMinRating(value)} />
                <span className="stars">★★★★★</span> từ {value}
              </label>
            ))}
          </div>
          <div className="filter-group">
            <h3>Giao hàng</h3>
            {[1, 2, 5].map((value) => (
              <label key={value}>
                <input type="radio" name="delivery" checked={delivery === value} onChange={() => setDelivery(value)} />
                <span>{value === 1 ? "Trong 24 giờ" : value === 2 ? "Trong 2 ngày" : "Tất cả"}</span>
              </label>
            ))}
          </div>
        </aside>

        <div className="product-area">
          <div className="product-toolbar">
            <div>
              <p className="eyebrow">GỢI Ý CHO BẠN</p>
              <h2>Sản phẩm nổi bật</h2>
              <span>{filtered.length} kết quả phù hợp</span>
            </div>
            <label>
              Sắp xếp
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="popular">Phổ biến</option>
                <option value="price-low">Giá thấp đến cao</option>
                <option value="price-high">Giá cao đến thấp</option>
                <option value="rating">Đánh giá cao</option>
              </select>
            </label>
          </div>

          <div className="product-grid">
            {filtered.map((product) => (
              <article className="product-card" key={product.id}>
                <button
                  className={`heart ${liked.includes(product.id) ? "active" : ""}`}
                  aria-label={`Yêu thích ${product.name}`}
                  onClick={() => setLiked(toggleWishlist(product.id))}
                >
                  {liked.includes(product.id) ? "♥" : "♡"}
                </button>
                {product.badge && <span className="badge">{product.badge}</span>}
                <button className="product-image" onClick={() => setSelected(product)} aria-label={`Xem ${product.name}`}>
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <span>Xem nhanh</span>
                </button>
                <div className="product-info">
                  <p className="product-category">{product.category}</p>
                  <a className="product-name" href={`/product/${product.id}`}>{product.name}</a>
                  <div className="rating"><span>★</span> {product.rating} <small>· Đã bán {product.sold}</small></div>
                  <div className="price-row">
                    <div><strong>{formatPrice(product.price)}</strong><del>{formatPrice(product.oldPrice)}</del></div>
                    <button onClick={() => addToCart(product)} aria-label={`Thêm ${product.name} vào giỏ`}>＋</button>
                  </div>
                  <p className="delivery">⚡ Giao trong {product.delivery === 1 ? "24 giờ" : `${product.delivery} ngày`}</p>
                </div>
              </article>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="empty-state">
              <span>⌕</span><h3>Chưa tìm thấy sản phẩm phù hợp</h3>
              <p>Thử nới rộng khoảng giá hoặc thay đổi từ khóa tìm kiếm.</p>
              <button onClick={() => { setQuery(""); setCategory("Tất cả"); setMaxPrice(7000000); setMinRating(0); }}>Xóa bộ lọc</button>
            </div>
          )}
        </div>
      </section>

      <section className="service-band">
        <div className="wrap">
          <div><span>↺</span><p><b>Đổi trả dễ dàng</b><small>Miễn phí trong 15 ngày</small></p></div>
          <div><span>♢</span><p><b>Thanh toán an toàn</b><small>Mã hóa theo chuẩn quốc tế</small></p></div>
          <div><span>⚡</span><p><b>Giao hàng thần tốc</b><small>Theo dõi đơn theo thời gian thực</small></p></div>
          <div><span>◎</span><p><b>Hỗ trợ tận tâm</b><small>Chat cùng NOVA 24/7</small></p></div>
        </div>
      </section>

      <footer>
        <div className="wrap footer-grid">
          <div className="footer-brand">
            <a className="brand" href="#top"><span className="brand-mark">N</span><span>NOVA<span>market</span></span></a>
            <p>Chọn kỹ từng món. Giao nhanh từng đơn. Mua sắm nhẹ nhàng hơn mỗi ngày.</p>
          </div>
          <div><h4>Về NOVA</h4><a href="/admin">Kênh quản trị</a><a href="/register">Đăng ký</a><a href="/policies/terms">Điều khoản</a></div>
          <div><h4>Hỗ trợ</h4><a href="/policies/privacy">Bảo mật</a><a href="/policies/returns">Chính sách đổi trả</a><a href="/policies/shipping">Vận chuyển</a></div>
          <div><h4>Nhận tin ưu đãi</h4><p>Deal tốt, không gửi dồn.</p><form onSubmit={(e) => { e.preventDefault(); setToast("Đăng ký nhận tin thành công!"); }}><input placeholder="Email của bạn" type="email" required /><button>→</button></form></div>
        </div>
        <div className="wrap copyright"><span>© 2026 NOVA Market</span><span>Made for brighter shopping.</span></div>
      </footer>

      <nav className="mobile-nav" aria-label="Điều hướng di động">
        <a href="#top"><span>⌂</span>Trang chủ</a>
        <a href="#products"><span>⌕</span>Tìm kiếm</a>
        <a href="/cart"><span>▱</span>Giỏ hàng{totalItems > 0 && <b>{totalItems}</b>}</a>
        <a href="/login"><span>♙</span>Tài khoản</a>
      </nav>

      {selected && (
        <div className="modal-backdrop" onMouseDown={() => setSelected(null)}>
          <section className="product-modal" role="dialog" aria-modal="true" aria-label="Chi tiết sản phẩm" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="Đóng">×</button>
            <div className="modal-gallery"><img src={selected.image} alt={selected.name} /><div><button className="active">1</button><button>2</button><button>3</button></div></div>
            <div className="modal-detail">
              <p className="eyebrow">{selected.category} · NOVA CHOICE</p>
              <h2>{selected.name}</h2>
              <div className="rating"><span>★</span> {selected.rating} <small>· 248 đánh giá · Đã bán {selected.sold}</small></div>
              <div className="modal-price"><strong>{formatPrice(selected.price)}</strong><del>{formatPrice(selected.oldPrice)}</del><b>-{Math.round((1 - selected.price / selected.oldPrice) * 100)}%</b></div>
              <p className="description">{selected.description}</p>
              <div className="variant"><b>Màu sắc</b><div><button className="active">Tiêu chuẩn</button><button>Than chì</button><button>Cát nhạt</button></div></div>
              <ul><li>✓ Sản phẩm chính hãng 100%</li><li>✓ Đổi trả miễn phí trong 15 ngày</li><li>✓ Bảo hành 12 tháng tại NOVA</li></ul>
              <a className="detail-page-link" href={`/product/${selected.id}`}>Xem trang chi tiết đầy đủ →</a>
              <div className="modal-actions"><button onClick={() => addToCart(selected)}>Thêm vào giỏ</button><button onClick={() => { addToCart(selected); window.location.href = "/cart"; }}>Mua ngay</button></div>
            </div>
          </section>
        </div>
      )}

      {cartOpen && (
        <div className="drawer-backdrop" onMouseDown={() => setCartOpen(false)}>
          <aside className="cart-drawer" onMouseDown={(e) => e.stopPropagation()}>
            <div className="drawer-header"><div><p className="eyebrow">ĐƠN HÀNG CỦA BẠN</p><h2>Giỏ hàng <span>({totalItems})</span></h2></div><button onClick={() => setCartOpen(false)}>×</button></div>
            <div className="shipping-progress"><div><span>⚡</span><p>{subtotal >= 499000 ? <><b>Bạn đã được miễn phí giao hàng!</b><small>Voucher Freeship đã sẵn sàng</small></> : <><b>Mua thêm {formatPrice(499000 - subtotal)} để được freeship</b><small>Áp dụng toàn quốc</small></>}</p></div><i><span style={{ width: `${Math.min(100, subtotal / 4990)}%` }}></span></i></div>
            <div className="cart-lines">
              {cart.map((item) => (
                <article key={item.id}>
                  <img src={item.image} alt="" />
                  <div><b>{item.name}</b><small>{item.category} · Tiêu chuẩn</small><strong>{formatPrice(item.price)}</strong><div className="quantity"><button onClick={() => updateQuantity(item.id, -1)}>−</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)}>＋</button></div></div>
                  <button className="remove" onClick={() => setCart((current) => current.filter((p) => p.id !== item.id))}>×</button>
                </article>
              ))}
              {cart.length === 0 && <div className="empty-cart"><span>▱</span><h3>Giỏ hàng đang trống</h3><p>Thêm vài món hay ho để bắt đầu nhé.</p><button onClick={() => setCartOpen(false)}>Tiếp tục mua sắm</button></div>}
            </div>
            {cart.length > 0 && <div className="cart-summary"><p><span>Tạm tính</span><b>{formatPrice(subtotal)}</b></p><p><span>Phí vận chuyển</span><b className="free">Miễn phí</b></p><div><span>Tổng cộng<small>Đã bao gồm VAT</small></span><strong>{formatPrice(subtotal)}</strong></div><button onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Thanh toán an toàn →</button><small>♢ Thông tin của bạn được bảo mật tuyệt đối</small></div>}
          </aside>
        </div>
      )}

      {loginOpen && (
        <div className="modal-backdrop" onMouseDown={() => setLoginOpen(false)}>
          <section className="login-modal" role="dialog" aria-modal="true" aria-label="Đăng nhập" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setLoginOpen(false)}>×</button>
            <div className="login-art"><div className="brand-mark">N</div><h2>Chào bạn trở lại.</h2><p>Đăng nhập để theo dõi đơn, lưu sản phẩm yêu thích và nhận ưu đãi riêng.</p><span>✦ 1.2M khách hàng tin chọn</span></div>
            <form onSubmit={(e) => { e.preventDefault(); setLoginOpen(false); setToast("Đăng nhập thành công. Chào mừng bạn!"); }}>
              <p className="eyebrow">TÀI KHOẢN NOVA</p><h2>Đăng nhập</h2>
              <label>Email hoặc số điện thoại<input required placeholder="hello@example.com" /></label>
              <label>Mật khẩu<input required type="password" placeholder="••••••••" /></label>
              <div className="form-row"><label><input type="checkbox" /> Ghi nhớ tôi</label><a href="#">Quên mật khẩu?</a></div>
              <button className="primary-submit">Đăng nhập</button>
              <p>Chưa có tài khoản? <a href="/register">Đăng ký miễn phí</a></p>
            </form>
          </section>
        </div>
      )}

      {checkoutOpen && (
        <div className="modal-backdrop" onMouseDown={() => setCheckoutOpen(false)}>
          <section className="checkout-modal" role="dialog" aria-modal="true" aria-label="Thanh toán" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setCheckoutOpen(false)}>×</button>
            <div className="checkout-form">
              <p className="eyebrow">THANH TOÁN AN TOÀN</p><h2>Hoàn tất đơn hàng</h2>
              <div className="steps"><b>1</b><i></i><b>2</b><i></i><b>3</b></div>
              <label>Họ và tên<input required placeholder="Nguyễn Minh Anh" /></label>
              <div className="two-col"><label>Số điện thoại<input placeholder="09xx xxx xxx" /></label><label>Tỉnh / Thành<select><option>TP. Hồ Chí Minh</option><option>Hà Nội</option><option>Đà Nẵng</option></select></label></div>
              <label>Địa chỉ nhận hàng<input placeholder="Số nhà, tên đường, phường / xã" /></label>
              <h3>Phương thức thanh toán</h3>
              <div className="payment-options">
                <label><input type="radio" name="payment" defaultChecked /><span>◎</span><b>Ví điện tử<small>MoMo, ZaloPay, VNPay</small></b></label>
                <label><input type="radio" name="payment" /><span>▭</span><b>Thẻ ngân hàng<small>Visa, Mastercard, JCB</small></b></label>
                <label><input type="radio" name="payment" /><span>⇄</span><b>Chuyển khoản<small>Xác nhận tự động</small></b></label>
              </div>
            </div>
            <aside className="checkout-summary">
              <h3>Đơn hàng của bạn</h3>
              {cart.slice(0, 3).map((item) => <div className="checkout-line" key={item.id}><img src={item.image} alt="" /><p>{item.name}<small>Số lượng: {item.quantity}</small></p><b>{formatPrice(item.price * item.quantity)}</b></div>)}
              <hr /><p><span>Tạm tính</span><b>{formatPrice(subtotal)}</b></p><p><span>Vận chuyển</span><b className="free">Miễn phí</b></p><div className="checkout-total"><span>Tổng thanh toán</span><strong>{formatPrice(subtotal)}</strong></div>
              <button onClick={() => { setCheckoutOpen(false); setCart([]); setToast("Đặt hàng thành công! Mã đơn #NV240726"); }}>Đặt hàng · {formatPrice(subtotal)}</button>
              <small>🔒 Giao dịch được mã hóa và bảo vệ</small>
            </aside>
          </section>
        </div>
      )}

      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </main>
  );
}
