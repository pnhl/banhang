export function SiteFooter() {
  return (
    <footer className="site-page-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <a className="brand" href="/"><span className="brand-mark">L</span><span>LOPA<span>MARKET</span></span></a>
          <p>Chọn kỹ từng món. Giao nhanh từng đơn. Mua sắm nhẹ nhàng hơn mỗi ngày.</p>
        </div>
        <div><h4>Mua sắm</h4><a href="/#products">Tất cả sản phẩm</a><a href="/stores">Gian hàng chính hãng</a><a href="/compare">So sánh sản phẩm</a><a href="/cart">Giỏ hàng</a><a href="/register">Đăng ký thành viên</a><a href="/support">Trung tâm trợ giúp</a></div>
        <div><h4>Chính sách</h4><a href="/policies/shipping">Vận chuyển</a><a href="/policies/returns">Đổi trả</a><a href="/policies/privacy">Bảo mật</a><a href="/policies/terms">Điều khoản</a></div>
        <div><h4>Dành cho đối tác</h4><a href="/seller">Seller Center</a><a href="/admin">Kênh quản trị</a><p>Quản lý gian hàng, đối soát và doanh thu tại một nơi.</p></div>
      </div>
      <div className="wrap copyright"><span>© 2026 LOPA MARKET</span><span>Mua sắm sáng suốt, mỗi ngày.</span></div>
    </footer>
  );
}
