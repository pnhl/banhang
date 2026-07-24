export const ADMIN_COOKIE = "nova-admin-session";

export async function getAdminPassword() {
  try {
    const { env } = await import("cloudflare:workers");
    const runtimeValue = (
      env as unknown as { ADMIN_PASSWORD?: string }
    ).ADMIN_PASSWORD?.trim();
    if (runtimeValue) return runtimeValue;
  } catch {
    // Node-based rendered HTML tests do not expose the Workers virtual module.
  }
  const configured = process.env.ADMIN_PASSWORD?.trim();
  if (configured) return configured;
  return "";
}

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function verifyAdminPassword(value: string) {
  const configured = await getAdminPassword();
  if (!configured) return false;
  const [candidate, expected] = await Promise.all([
    digest(value),
    digest(configured),
  ]);
  return safeEqual(candidate, expected);
}

export async function createAdminSessionToken() {
  const configured = await getAdminPassword();
  if (!configured) return "";
  return digest(`nova-market-admin:${configured}`);
}
