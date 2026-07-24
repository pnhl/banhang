export function SiteFooter() {
  return (
    <footer className="site-page-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <a className="brand" href="/"><span className="brand-mark">N</span><span>NOVA<span>market</span></span></a>
          <p>Chọn kỹ từng món. Giao nhanh từng đơn. Mua sắm nhẹ nhàng hơn mỗi ngày.</p>
        </div>
        <div><h4>Mua sắm</h4><a href="/#products">Tất cả sản phẩm</a><a href="/cart">Giỏ hàng</a><a href="/register">Đăng ký thành viên</a><a href="/support">Trung tâm trợ giúp</a></div>
        <div><h4>Chính sách</h4><a href="/policies/shipping">Vận chuyển</a><a href="/policies/returns">Đổi trả</a><a href="/policies/privacy">Bảo mật</a><a href="/policies/terms">Điều khoản</a></div>
        <div><h4>Dành cho đối tác</h4><a href="/admin">Kênh quản trị</a><p>Quản lý sản phẩm, đơn hàng và doanh thu tại một nơi.</p></div>
      </div>
      <div className="wrap copyright"><span>© 2026 NOVA Market</span><span>Mua sắm sáng suốt, mỗi ngày.</span></div>
    </footer>
  );
}
