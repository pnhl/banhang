import { notFound } from "next/navigation";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";

const policies = {
  shipping: {
    eyebrow: "GIAO HÀNG & NHẬN HÀNG",
    title: "Chính sách vận chuyển",
    intro: "NOVA Market phối hợp với các đối tác vận chuyển uy tín để đơn hàng đến tay bạn an toàn, đúng hẹn và dễ theo dõi.",
    updated: "Cập nhật ngày 24.07.2026",
    sections: [
      ["1. Phạm vi giao hàng", "NOVA Market giao hàng toàn quốc, ngoại trừ một số khu vực hạn chế theo thông báo của đơn vị vận chuyển. Thời gian dự kiến được hiển thị rõ tại trang sản phẩm và bước thanh toán."],
      ["2. Thời gian xử lý", "Đơn hàng được xác nhận trước 14:00 thường được bàn giao cho đơn vị vận chuyển trong cùng ngày làm việc. Đơn cuối tuần hoặc ngày lễ được xử lý vào ngày làm việc kế tiếp."],
      ["3. Phí vận chuyển", "Phí được tính theo địa chỉ, khối lượng và chương trình ưu đãi tại thời điểm đặt hàng. Các đơn đủ điều kiện miễn phí vận chuyển sẽ được hiển thị trước khi xác nhận thanh toán."],
      ["4. Theo dõi đơn hàng", "Sau khi đơn được bàn giao, bạn sẽ nhận mã vận đơn qua email hoặc thông báo tài khoản. Trạng thái có thể cần tối đa 12 giờ để đồng bộ."],
      ["5. Kiểm tra khi nhận", "Vui lòng kiểm tra tình trạng kiện hàng, tem niêm phong và số lượng bên ngoài trước khi nhận. Nếu có dấu hiệu hư hỏng, hãy chụp ảnh và liên hệ NOVA trong vòng 24 giờ."],
    ],
  },
  returns: {
    eyebrow: "ĐỔI TRẢ & HOÀN TIỀN",
    title: "Chính sách đổi trả",
    intro: "Bạn có 15 ngày để đổi trả sản phẩm đủ điều kiện. Quy trình được thiết kế rõ ràng và không làm mất thời gian của bạn.",
    updated: "Cập nhật ngày 24.07.2026",
    sections: [
      ["1. Điều kiện đổi trả", "Sản phẩm còn nguyên tem, phụ kiện, quà tặng và bao bì; chưa qua sử dụng ngoài phạm vi cần thiết để kiểm tra. Một số nhóm hàng vệ sinh cá nhân có điều kiện riêng."],
      ["2. Thời hạn yêu cầu", "Yêu cầu cần được gửi trong vòng 15 ngày kể từ thời điểm hệ thống ghi nhận giao hàng thành công."],
      ["3. Sản phẩm lỗi hoặc sai", "NOVA chịu toàn bộ chi phí vận chuyển khi sản phẩm bị lỗi, hư hỏng do vận chuyển, thiếu phụ kiện hoặc không đúng mô tả."],
      ["4. Hoàn tiền", "Khoản hoàn được xử lý về phương thức thanh toán ban đầu trong 3–10 ngày làm việc sau khi sản phẩm được kiểm tra và chấp thuận."],
      ["5. Cách gửi yêu cầu", "Đăng nhập, mở chi tiết đơn hàng và chọn “Yêu cầu đổi trả”, hoặc liên hệ trung tâm hỗ trợ kèm mã đơn và hình ảnh sản phẩm."],
    ],
  },
  privacy: {
    eyebrow: "DỮ LIỆU & QUYỀN RIÊNG TƯ",
    title: "Chính sách bảo mật",
    intro: "NOVA tôn trọng quyền riêng tư và chỉ xử lý dữ liệu cần thiết để cung cấp, bảo vệ và cải thiện trải nghiệm mua sắm.",
    updated: "Cập nhật ngày 26.07.2026",
    sections: [
      ["1. Dữ liệu được thu thập", "Thông tin tài khoản, liên hệ, địa chỉ giao hàng, lịch sử giao dịch và dữ liệu kỹ thuật cần thiết để vận hành dịch vụ."],
      ["2. Mục đích sử dụng", "Xử lý đơn hàng, hỗ trợ khách hàng, phòng chống gian lận, cá nhân hóa trải nghiệm và gửi thông báo khi bạn đã đồng ý."],
      ["3. Chia sẻ dữ liệu", "Dữ liệu chỉ được chia sẻ ở mức cần thiết với đơn vị thanh toán, vận chuyển và nhà cung cấp dịch vụ tuân thủ yêu cầu bảo mật."],
      ["4. Thời gian lưu trữ", "Dữ liệu được lưu trong thời gian cần thiết cho mục đích cung cấp dịch vụ và nghĩa vụ pháp lý, sau đó được xóa hoặc ẩn danh."],
      ["5. Quyền của bạn", "Bạn có thể yêu cầu truy cập, chỉnh sửa, hạn chế xử lý hoặc xóa dữ liệu theo quy định áp dụng bằng cách liên hệ bộ phận bảo mật."],
      ["6. Đo lường và Google Analytics", "Google Analytics chỉ được kích hoạt khi mã đo lường được cấu hình và bạn chọn đồng ý phân tích. NOVA mặc định từ chối lưu trữ dữ liệu phân tích, không bật lưu trữ quảng cáo và cho phép bạn tiếp tục chỉ với dữ liệu thiết yếu."],
    ],
  },
  terms: {
    eyebrow: "QUYỀN & TRÁCH NHIỆM",
    title: "Điều khoản sử dụng",
    intro: "Điều khoản này quy định việc truy cập, mua sắm và sử dụng các dịch vụ do NOVA Market cung cấp.",
    updated: "Cập nhật ngày 24.07.2026",
    sections: [
      ["1. Chấp nhận điều khoản", "Khi truy cập hoặc đặt hàng, bạn xác nhận đã đọc, hiểu và đồng ý với điều khoản cùng các chính sách được dẫn chiếu."],
      ["2. Tài khoản người dùng", "Bạn chịu trách nhiệm bảo mật thông tin đăng nhập, cung cấp thông tin chính xác và thông báo ngay khi phát hiện truy cập trái phép."],
      ["3. Giá và đơn hàng", "Giá, ưu đãi và tồn kho có thể thay đổi. Đơn hàng chỉ được xác nhận khi NOVA gửi thông báo chấp thuận sau bước kiểm tra cần thiết."],
      ["4. Hành vi bị cấm", "Không sử dụng dịch vụ để gian lận, xâm phạm quyền của người khác, can thiệp hệ thống hoặc khai thác dữ liệu trái phép."],
      ["5. Giới hạn trách nhiệm", "NOVA nỗ lực duy trì dịch vụ liên tục nhưng không đảm bảo mọi gián đoạn nằm ngoài kiểm soát. Trách nhiệm được giới hạn trong phạm vi pháp luật cho phép."],
    ],
  },
} as const;

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = policies[slug as keyof typeof policies];
  if (!policy) notFound();
  return <><SiteHeader /><main className="policy-page"><header><div className="wrap"><p className="eyebrow">{policy.eyebrow}</p><h1>{policy.title}</h1><p>{policy.intro}</p><small>{policy.updated}</small></div></header><div className="policy-layout wrap"><aside><b>Trong trang này</b>{policy.sections.map(([title]) => <a key={title} href={`#${title.slice(0,1)}`}>{title}</a>)}<div><span>?</span><p><b>Cần hỗ trợ?</b><small>Đội ngũ NOVA sẵn sàng 24/7</small></p></div></aside><article>{policy.sections.map(([title, copy]) => <section id={title.slice(0,1)} key={title}><h2>{title}</h2><p>{copy}</p></section>)}<div className="policy-contact"><p className="eyebrow">VẪN CÒN THẮC MẮC?</p><h2>Chúng tôi ở đây để hỗ trợ.</h2><p>Liên hệ qua support@novamarket.vn hoặc hotline 1900 6868 từ 8:00–22:00 mỗi ngày.</p><a href="/">Quay lại trang chủ →</a></div></article></div></main><SiteFooter /></>;
}
