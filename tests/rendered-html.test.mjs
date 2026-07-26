import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the NOVA Market storefront", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /NOVA Market/i);
  assert.match(html, /Sản phẩm nổi bật/i);
  assert.match(html, /NovaSound Air/i);
  assert.doesNotMatch(html, /Your site is taking shape/i);
});

test("renders the connected commerce routes", async () => {
  const routes = [
    ["/cart", "Giỏ hàng"],
    ["/compare", "So sánh sản phẩm"],
    ["/checkout", "Hoàn tất đơn hàng"],
    ["/orders/NV-DEMO", "Đang tải đơn hàng"],
    ["/account", "Đăng nhập để quản lý mua sắm"],
    ["/wishlist", "Sản phẩm yêu thích"],
    ["/support", "Trung tâm trợ giúp"],
    ["/login", "Đăng nhập"],
    ["/register", "Đăng ký thành viên"],
    ["/product/1", "Tai nghe chụp tai NovaSound Air"],
    ["/product/999999", "Đang tải sản phẩm"],
    ["/category/dien-tu", "Thiết bị điện tử chọn lọc"],
    ["/stores", "Mỗi gian hàng, một chuyên môn"],
    ["/store/nova-digital", "NOVA Digital"],
    ["/invoices/NV-DEMO", "Đang chuẩn bị hóa đơn"],
    ["/policies/shipping", "Chính sách vận chuyển"],
  ];

  for (const [path, expected] of routes) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), new RegExp(expected, "i"), path);
  }
});

test("protects the admin dashboard behind the password screen", async () => {
  const response = await render("/admin");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Đăng nhập quản trị/i);
  assert.doesNotMatch(html, /Doanh thu ghi nhận/i);
});

test("renders marketplace SEO and protects seller operations", async () => {
  const productResponse = await render("/product/1");
  assert.equal(productResponse.status, 200);
  const productHtml = await productResponse.text();
  assert.match(productHtml, /application\/ld\+json/i);
  assert.match(productHtml, /schema\.org/i);
  assert.match(productHtml, /NOVA Digital/i);

  const categoryResponse = await render("/category/dien-tu");
  assert.equal(categoryResponse.status, 200);
  const categoryHtml = await categoryResponse.text();
  assert.match(categoryHtml, /ItemList/i);
  assert.match(categoryHtml, /NOVA Digital/i);

  const sellerResponse = await render("/seller");
  assert.equal(sellerResponse.status, 200);
  const sellerHtml = await sellerResponse.text();
  assert.match(sellerHtml, /Đăng nhập quản trị/i);
  assert.doesNotMatch(sellerHtml, /Số dư chờ đối soát/i);
});

test("publishes crawler discovery files", async () => {
  const robotsResponse = await render("/robots.txt");
  assert.equal(robotsResponse.status, 200);
  const robotsText = await robotsResponse.text();
  assert.match(robotsText, /sitemap\.xml/i);
  assert.match(robotsText, /Disallow: \/admin/i);

  const sitemapResponse = await render("/sitemap.xml");
  assert.equal(sitemapResponse.status, 200);
  const sitemapText = await sitemapResponse.text();
  assert.match(sitemapText, /category\/dien-tu/i);
  assert.match(sitemapText, /store\/nova-digital/i);
  assert.match(sitemapText, /product\/1/i);
});
