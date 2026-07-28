import { getRuntimeSecret } from "./commerce-server";
import { PlatformError } from "./platform-server";

const PAYOS_API = "https://api-merchant.payos.vn";

export type PayOSPaymentData = {
  bin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  currency: string;
  paymentLinkId: string;
  status: string;
  checkoutUrl: string;
  qrCode: string;
};

type PayOSConfig = {
  clientId: string;
  apiKey: string;
  checksumKey: string;
};

export async function getPayOSConfig(): Promise<PayOSConfig | null> {
  const [clientId, apiKey, checksumKey] = await Promise.all([
    getRuntimeSecret("PAYOS_CLIENT_ID"),
    getRuntimeSecret("PAYOS_API_KEY"),
    getRuntimeSecret("PAYOS_CHECKSUM_KEY"),
  ]);
  return clientId && apiKey && checksumKey
    ? { clientId, apiKey, checksumKey }
    : null;
}

async function hmacSha256(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function payOSHeaders(config: PayOSConfig) {
  return {
    "content-type": "application/json",
    "x-client-id": config.clientId,
    "x-api-key": config.apiKey,
  };
}

export async function createPayOSPayment(input: {
  orderCode: number;
  amount: number;
  description: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  cancelUrl: string;
  returnUrl: string;
  expiredAt: number;
}) {
  const config = await getPayOSConfig();
  if (!config) {
    throw new PlatformError(
      "payOS chưa được cấu hình. Hãy thêm PAYOS_CLIENT_ID, PAYOS_API_KEY và PAYOS_CHECKSUM_KEY vào môi trường triển khai.",
      503,
    );
  }
  const signatureData = [
    `amount=${input.amount}`,
    `cancelUrl=${input.cancelUrl}`,
    `description=${input.description}`,
    `orderCode=${input.orderCode}`,
    `returnUrl=${input.returnUrl}`,
  ].join("&");
  const response = await fetch(`${PAYOS_API}/v2/payment-requests`, {
    method: "POST",
    headers: payOSHeaders(config),
    body: JSON.stringify({
      ...input,
      signature: await hmacSha256(signatureData, config.checksumKey),
    }),
  });
  const result = (await response.json().catch(() => null)) as {
    code?: string;
    desc?: string;
    data?: PayOSPaymentData;
  } | null;
  if (!response.ok || result?.code !== "00" || !result.data) {
    throw new PlatformError(
      result?.desc || "payOS chưa thể tạo liên kết thanh toán.",
      response.status >= 400 ? response.status : 502,
    );
  }
  return result.data;
}

export async function getPayOSPayment(id: string | number) {
  const config = await getPayOSConfig();
  if (!config) return null;
  const response = await fetch(
    `${PAYOS_API}/v2/payment-requests/${encodeURIComponent(String(id))}`,
    { headers: payOSHeaders(config), cache: "no-store" },
  );
  const result = (await response.json().catch(() => null)) as {
    code?: string;
    data?: PayOSPaymentData & { amountPaid?: number; canceledAt?: string };
  } | null;
  return response.ok && result?.code === "00" ? result.data ?? null : null;
}

export async function cancelPayOSPayment(
  id: string | number,
  reason: string,
) {
  const config = await getPayOSConfig();
  if (!config) return null;
  const response = await fetch(
    `${PAYOS_API}/v2/payment-requests/${encodeURIComponent(String(id))}/cancel`,
    {
      method: "POST",
      headers: payOSHeaders(config),
      body: JSON.stringify({ cancellationReason: reason.slice(0, 120) }),
    },
  );
  const result = (await response.json().catch(() => null)) as {
    code?: string;
    data?: PayOSPaymentData;
  } | null;
  return response.ok && result?.code === "00" ? result.data ?? null : null;
}

export async function confirmPayOSWebhook(webhookUrl: string) {
  const config = await getPayOSConfig();
  if (!config) return false;
  const response = await fetch(`${PAYOS_API}/confirm-webhook`, {
    method: "POST",
    headers: payOSHeaders(config),
    body: JSON.stringify({ webhookUrl }),
  });
  const result = (await response.json().catch(() => null)) as {
    code?: string;
  } | null;
  return response.ok && result?.code === "00";
}

function valueForSignature(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === "null" ||
    value === "undefined"
  ) {
    return "";
  }
  if (Array.isArray(value)) {
    return JSON.stringify(
      value.map((item) =>
        item && typeof item === "object"
          ? Object.fromEntries(
              Object.entries(item as Record<string, unknown>).sort(([a], [b]) =>
                a.localeCompare(b),
              ),
            )
          : item,
      ),
    );
  }
  return String(value);
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function verifyPayOSWebhook(
  data: Record<string, unknown>,
  signature: string,
) {
  const config = await getPayOSConfig();
  if (!config) return false;
  const signatureData = Object.keys(data)
    .sort()
    .map((key) => `${key}=${valueForSignature(data[key])}`)
    .join("&");
  const expected = await hmacSha256(signatureData, config.checksumKey);
  return safeEqual(expected, signature.toLowerCase());
}
