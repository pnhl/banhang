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
