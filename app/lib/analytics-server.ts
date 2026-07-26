export async function getGoogleAnalyticsId() {
  try {
    const { env } = await import("cloudflare:workers");
    const runtimeValue = (
      env as unknown as { GOOGLE_ANALYTICS_ID?: string }
    ).GOOGLE_ANALYTICS_ID?.trim();
    if (runtimeValue) return runtimeValue;
  } catch {
    // Local Node renders do not expose the Workers virtual module.
  }
  return process.env.GOOGLE_ANALYTICS_ID?.trim() ?? "";
}
