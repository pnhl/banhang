export type BusinessProfile = {
  name: string;
  taxCode: string;
  address: string;
  email: string;
  invoiceSeries: string;
  vatRate: number;
};

export const BUSINESS_PROFILE_KEY = "nova-business-profile";

export const defaultBusinessProfile: BusinessProfile = {
  name: "NOVA MARKET",
  taxCode: "Đang cập nhật",
  address: "Việt Nam",
  email: "hoadon@novamarket.vn",
  invoiceSeries: "1C26TNV",
  vatRate: 0.1,
};

export function getBusinessProfile(): BusinessProfile {
  if (typeof window === "undefined") return defaultBusinessProfile;
  try {
    const value = JSON.parse(
      window.localStorage.getItem(BUSINESS_PROFILE_KEY) ?? "null",
    ) as Partial<BusinessProfile> | null;
    return value ? { ...defaultBusinessProfile, ...value } : defaultBusinessProfile;
  } catch {
    return defaultBusinessProfile;
  }
}

export function saveBusinessProfile(profile: BusinessProfile) {
  window.localStorage.setItem(BUSINESS_PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event("nova-business-profile-updated"));
}

export function calculateIncludedTax(
  totalIncludingTax: number,
  vatRate = defaultBusinessProfile.vatRate,
) {
  if (totalIncludingTax <= 0 || vatRate <= 0) {
    return { beforeTax: Math.max(0, totalIncludingTax), tax: 0 };
  }
  const beforeTax = Math.round(totalIncludingTax / (1 + vatRate));
  return {
    beforeTax,
    tax: Math.max(0, totalIncludingTax - beforeTax),
  };
}

export function createInvoiceNumber(orderId: string, createdAt = new Date()) {
  return `${defaultBusinessProfile.invoiceSeries}-${createdAt
    .toISOString()
    .slice(2, 10)
    .replaceAll("-", "")}-${orderId.replace(/[^A-Z0-9]/gi, "").slice(-8)}`;
}
