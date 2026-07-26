"use client";

export type CommerceEventName =
  | "view_item"
  | "view_item_list"
  | "search"
  | "add_to_cart"
  | "view_cart"
  | "begin_checkout"
  | "add_shipping_info"
  | "add_payment_info"
  | "purchase"
  | "select_promotion"
  | "view_store";

export type CommerceEvent = {
  name: CommerceEventName;
  params: Record<string, unknown>;
  createdAt: string;
  sessionId: string;
};

const ANALYTICS_KEY = "nova-analytics-events";
const SESSION_KEY = "nova-analytics-session";
const MAX_LOCAL_EVENTS = 300;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function getSessionId() {
  if (typeof window === "undefined") return "server";
  const current = window.sessionStorage.getItem(SESSION_KEY);
  if (current) return current;
  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(SESSION_KEY, next);
  return next;
}

export function getLocalAnalyticsEvents(): CommerceEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(ANALYTICS_KEY) ?? "[]",
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function trackCommerceEvent(
  name: CommerceEventName,
  params: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  const event: CommerceEvent = {
    name,
    params,
    createdAt: new Date().toISOString(),
    sessionId: getSessionId(),
  };
  const next = [...getLocalAnalyticsEvents(), event].slice(-MAX_LOCAL_EVENTS);
  window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("nova-analytics-updated"));

  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  } else if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: name, ...params });
  }

  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(event),
    keepalive: true,
  }).catch(() => undefined);
}
