"use client";

import { type FormEvent, useEffect, useState } from "react";
import { formatPrice } from "../../lib/catalog";

type InventoryRow = {
  productId: number;
  name: string;
  image: string;
  available: number;
  reserved: number;
  lowStockThreshold: number;
};

type ShipmentRow = {
  id: string;
  order_id: string;
  carrier: string;
  tracking_code: string;
  status: string;
  estimated_delivery: string | null;
  updated_at: string;
};

type ReturnRow = {
  id: string;
  order_id: string;
  reason: string;
  details: string;
  status: string;
  resolution: string | null;
  refund_amount: number;
  updated_at: string;
};

type ApplicationRow = {
  id: string;
  email: string;
  shop_name: string;
  business_type: string;
  phone: string;
  description: string;
  status: string;
};

type OperationsData = {
  role: "seller" | "admin";
  inventory: InventoryRow[];
  shipments: ShipmentRow[];
  returns: ReturnRow[];
  applications: ApplicationRow[];
};

const tabs = [
  ["inventory", "Tồn kho"],
  ["shipping", "Vận chuyển"],
  ["returns", "Đổi trả"],
  ["applications", "Duyệt người bán"],
] as const;

export function SellerOperations() {
  const [data, setData] = useState<OperationsData | null>(null);
  const [active, setActive] = useState<(typeof tabs)[number][0]>("inventory");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/seller/operations", {
      cache: "no-store",
    });
    const result = (await response.json()) as OperationsData & {
      message?: string;
    };
    if (response.ok) setData(result);
    else setMessage(result.message ?? "Không tải được dữ liệu vận hành.");
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const updateInventory = async (
    row: InventoryRow,
    available: number,
    threshold: number,
  ) => {
    const response = await fetch("/api/inventory", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productId: row.productId,
        available,
        lowStockThreshold: threshold,
      }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    setMessage(
      response.ok ? `Đã cập nhật tồn kho “${row.name}”.` : result.message ?? "",
    );
    await load();
  };

  const updateShipment = async (
    row: ShipmentRow,
    status: string,
    note: string,
  ) => {
    const response = await fetch(`/api/orders/${row.order_id}/tracking`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    setMessage(
      response.ok ? `Đã cập nhật đơn #${row.order_id}.` : result.message ?? "",
    );
    await load();
  };

  const updateReturn = async (
    row: ReturnRow,
    status: string,
    resolution: string,
    refundAmount: number,
  ) => {
    const response = await fetch(`/api/orders/${row.order_id}/returns`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        returnId: row.id,
        status,
        resolution,
        refundAmount,
      }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    setMessage(
      response.ok ? `Đã cập nhật yêu cầu ${row.id}.` : result.message ?? "",
    );
    await load();
  };

  const reviewApplication = async (
    row: ApplicationRow,
    status: "approved" | "rejected",
    note: string,
  ) => {
    const response = await fetch("/api/seller/application", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: row.id,
        status,
        reviewerNote: note,
      }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    setMessage(
      response.ok
        ? `Đã ${status === "approved" ? "duyệt" : "từ chối"} ${row.shop_name}.`
        : result.message ?? "",
    );
    await load();
  };

  return (
    <main className="seller-tool-page">
      <header className="seller-tool-header">
        <a className="brand" href="/seller">
          <span className="brand-mark">L</span>
          <span>LOPA<span>operations</span></span>
        </a>
        <nav>
          <a href="/seller/media">Thư viện R2</a>
          <a href="/seller">Seller Center</a>
        </nav>
      </header>
      <section className="seller-tool-shell">
        <div className="seller-tool-title">
          <div>
            <p className="eyebrow">D1 OPERATIONS</p>
            <h1>Trung tâm vận hành</h1>
            <p>
              Tồn kho, giao hàng, đổi trả và phân quyền được cập nhật phía máy
              chủ.
            </p>
          </div>
          <span>{data?.role === "admin" ? "Quản trị viên" : "Người bán"}</span>
        </div>
        <nav className="seller-operation-tabs">
          {tabs
            .filter(([id]) => id !== "applications" || data?.role === "admin")
            .map(([id, label]) => (
              <button
                className={active === id ? "active" : ""}
                key={id}
                onClick={() => setActive(id)}
              >
                {label}
              </button>
            ))}
        </nav>
        {message && <div className="platform-notice">{message}</div>}
        {loading || !data ? (
          <div className="platform-loading">Đang đồng bộ dữ liệu D1…</div>
        ) : (
          <>
            {active === "inventory" && (
              <>
                <ProductCreator onCreated={load} setMessage={setMessage} />
                <section className="operation-list inventory-operations">
                  {data.inventory.map((row) => (
                    <InventoryEditor
                      key={row.productId}
                      row={row}
                      onSave={updateInventory}
                    />
                  ))}
                </section>
              </>
            )}
            {active === "shipping" && (
              <section className="operation-list">
                {data.shipments.map((row) => (
                  <ShipmentEditor
                    key={row.id}
                    row={row}
                    onSave={updateShipment}
                  />
                ))}
                {!data.shipments.length && <Empty text="Chưa có đơn vận chuyển." />}
              </section>
            )}
            {active === "returns" && (
              <section className="operation-list">
                {data.returns.map((row) => (
                  <ReturnEditor key={row.id} row={row} onSave={updateReturn} />
                ))}
                {!data.returns.length && <Empty text="Chưa có yêu cầu đổi trả." />}
              </section>
            )}
            {active === "applications" && data.role === "admin" && (
              <section className="operation-list">
                {data.applications.map((row) => (
                  <ApplicationEditor
                    key={row.id}
                    row={row}
                    onSave={reviewApplication}
                  />
                ))}
                {!data.applications.length && <Empty text="Chưa có hồ sơ người bán." />}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function ProductCreator({
  onCreated,
  setMessage,
}: {
  onCreated: () => Promise<void>;
  setMessage: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        category: form.get("category"),
        price: Number(form.get("price")),
        oldPrice: Number(form.get("oldPrice")),
        deliveryDays: Number(form.get("deliveryDays")),
        imageUrl: form.get("imageUrl"),
        badge: form.get("badge"),
        description: form.get("description"),
        stock: Number(form.get("stock")),
      }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    setMessage(
      response.ok ? "Đã tạo sản phẩm trong D1." : result.message ?? "",
    );
    if (response.ok) {
      event.currentTarget.reset();
      setOpen(false);
      await onCreated();
    }
  };
  return (
    <section className="product-creator">
      <header>
        <div>
          <p className="eyebrow">DANH MỤC D1</p>
          <h2>Sản phẩm của gian hàng</h2>
        </div>
        <button onClick={() => setOpen((value) => !value)}>
          {open ? "Đóng" : "+ Thêm sản phẩm"}
        </button>
      </header>
      {open && (
        <form onSubmit={submit}>
          <label>Tên sản phẩm<input required name="name" /></label>
          <label>Danh mục<input required name="category" /></label>
          <label>Giá bán<input required name="price" min={0} type="number" /></label>
          <label>Giá gốc<input required name="oldPrice" min={0} type="number" /></label>
          <label>Tồn đầu kỳ<input required name="stock" min={0} type="number" /></label>
          <label>Giao trong ngày<input required name="deliveryDays" min={1} max={30} type="number" defaultValue={3} /></label>
          <label className="wide">URL ảnh R2 hoặc HTTPS<input required name="imageUrl" placeholder="/media/media-..." /></label>
          <label>Nhãn<input name="badge" placeholder="MỚI" /></label>
          <label className="wide">Mô tả<textarea required minLength={20} name="description" /></label>
          <button>Lưu sản phẩm vào D1</button>
          <a href="/seller/media">Mở thư viện ảnh R2 →</a>
        </form>
      )}
    </section>
  );
}

function InventoryEditor({
  row,
  onSave,
}: {
  row: InventoryRow;
  onSave: (row: InventoryRow, available: number, threshold: number) => void;
}) {
  const [available, setAvailable] = useState(row.available);
  const [threshold, setThreshold] = useState(row.lowStockThreshold);
  return (
    <article>
      <img src={row.image} alt={row.name} />
      <div>
        <b>{row.name}</b>
        <small>
          Đang giữ {row.reserved} · Ngưỡng cảnh báo {row.lowStockThreshold}
        </small>
      </div>
      <label>
        Có thể bán
        <input
          type="number"
          min={0}
          value={available}
          onChange={(event) => setAvailable(Number(event.target.value))}
        />
      </label>
      <label>
        Báo sắp hết
        <input
          type="number"
          min={0}
          value={threshold}
          onChange={(event) => setThreshold(Number(event.target.value))}
        />
      </label>
      <button onClick={() => onSave(row, available, threshold)}>Lưu</button>
    </article>
  );
}

function ShipmentEditor({
  row,
  onSave,
}: {
  row: ShipmentRow;
  onSave: (row: ShipmentRow, status: string, note: string) => void;
}) {
  const [status, setStatus] = useState(row.status);
  const [note, setNote] = useState("");
  return (
    <article>
      <div>
        <b>#{row.order_id}</b>
        <small>
          {row.carrier} · {row.tracking_code}
        </small>
      </div>
      <select value={status} onChange={(event) => setStatus(event.target.value)}>
        {[
          "Chờ xác nhận",
          "Đang đóng gói",
          "Đã bàn giao vận chuyển",
          "Đang giao",
          "Giao lại",
          "Hoàn tất",
          "Đã hủy",
        ].map((item) => <option key={item}>{item}</option>)}
      </select>
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Ghi chú cho khách hàng"
      />
      <button disabled={!note.trim()} onClick={() => onSave(row, status, note)}>
        Cập nhật
      </button>
    </article>
  );
}

function ReturnEditor({
  row,
  onSave,
}: {
  row: ReturnRow;
  onSave: (
    row: ReturnRow,
    status: string,
    resolution: string,
    refundAmount: number,
  ) => void;
}) {
  const [status, setStatus] = useState(row.status);
  const [resolution, setResolution] = useState(row.resolution ?? "");
  const [refundAmount, setRefundAmount] = useState(row.refund_amount);
  return (
    <article className="return-operation">
      <div>
        <b>#{row.order_id} · {row.reason}</b>
        <small>{row.details}</small>
      </div>
      <select value={status} onChange={(event) => setStatus(event.target.value)}>
        {["submitted", "reviewing", "approved", "rejected", "refunded", "closed"].map(
          (item) => <option key={item}>{item}</option>,
        )}
      </select>
      <input
        value={resolution}
        onChange={(event) => setResolution(event.target.value)}
        placeholder="Phương án xử lý"
      />
      <label>
        Hoàn tiền
        <input
          type="number"
          min={0}
          value={refundAmount}
          onChange={(event) => setRefundAmount(Number(event.target.value))}
        />
        <small>{formatPrice(refundAmount)}</small>
      </label>
      <button onClick={() => onSave(row, status, resolution, refundAmount)}>
        Lưu
      </button>
    </article>
  );
}

function ApplicationEditor({
  row,
  onSave,
}: {
  row: ApplicationRow;
  onSave: (
    row: ApplicationRow,
    status: "approved" | "rejected",
    note: string,
  ) => void;
}) {
  const [note, setNote] = useState("");
  return (
    <article className="application-operation">
      <div>
        <b>{row.shop_name}</b>
        <small>
          {row.email} · {row.business_type} · {row.phone}
        </small>
        <p>{row.description}</p>
      </div>
      <span>{row.status}</span>
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Ghi chú xét duyệt"
      />
      <div>
        <button onClick={() => onSave(row, "approved", note)}>Duyệt</button>
        <button onClick={() => onSave(row, "rejected", note)}>Từ chối</button>
      </div>
    </article>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="platform-empty"><span>◇</span><h2>{text}</h2></div>;
}
