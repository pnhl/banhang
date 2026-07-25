export type VietnamProvince = {
  code: number;
  name: string;
  division_type?: string;
};

export type VietnamWard = {
  code: number;
  name: string;
  province_code: number;
  division_type?: string;
};

export type LocationResult<T> = {
  items: T[];
  fromFallback: boolean;
};

const API_BASE = "https://provinces.open-api.vn/api/v2";
const PROVINCES_CACHE_KEY = "nova-location-provinces-v2";
const WARDS_CACHE_PREFIX = "nova-location-wards-v2-";

const fallbackProvinces: VietnamProvince[] = [
  { code: 1, name: "Thành phố Hà Nội" },
  { code: 4, name: "Tỉnh Cao Bằng" },
  { code: 8, name: "Tỉnh Tuyên Quang" },
  { code: 11, name: "Tỉnh Điện Biên" },
  { code: 12, name: "Tỉnh Lai Châu" },
  { code: 14, name: "Tỉnh Sơn La" },
  { code: 15, name: "Tỉnh Lào Cai" },
  { code: 19, name: "Tỉnh Thái Nguyên" },
  { code: 20, name: "Tỉnh Lạng Sơn" },
  { code: 22, name: "Tỉnh Quảng Ninh" },
  { code: 24, name: "Tỉnh Bắc Ninh" },
  { code: 25, name: "Tỉnh Phú Thọ" },
  { code: 31, name: "Thành phố Hải Phòng" },
  { code: 33, name: "Tỉnh Hưng Yên" },
  { code: 37, name: "Tỉnh Ninh Bình" },
  { code: 38, name: "Tỉnh Thanh Hóa" },
  { code: 40, name: "Tỉnh Nghệ An" },
  { code: 42, name: "Tỉnh Hà Tĩnh" },
  { code: 44, name: "Tỉnh Quảng Trị" },
  { code: 46, name: "Thành phố Huế" },
  { code: 48, name: "Thành phố Đà Nẵng" },
  { code: 51, name: "Tỉnh Quảng Ngãi" },
  { code: 52, name: "Tỉnh Gia Lai" },
  { code: 56, name: "Tỉnh Khánh Hòa" },
  { code: 66, name: "Tỉnh Đắk Lắk" },
  { code: 68, name: "Tỉnh Lâm Đồng" },
  { code: 75, name: "Tỉnh Đồng Nai" },
  { code: 79, name: "Thành phố Hồ Chí Minh" },
  { code: 80, name: "Tỉnh Tây Ninh" },
  { code: 82, name: "Tỉnh Đồng Tháp" },
  { code: 86, name: "Tỉnh Vĩnh Long" },
  { code: 91, name: "Tỉnh An Giang" },
  { code: 92, name: "Thành phố Cần Thơ" },
  { code: 96, name: "Tỉnh Cà Mau" },
];

function readCache<T>(key: string): T[] | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "null");
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Location selection still works when browser storage is unavailable.
  }
}

async function fetchLocations<T>(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Location API returned ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Invalid location response");
  return data as T[];
}

export async function loadProvinces(): Promise<
  LocationResult<VietnamProvince>
> {
  const cached = readCache<VietnamProvince>(PROVINCES_CACHE_KEY);
  if (cached?.length) return { items: cached, fromFallback: false };
  try {
    const provinces = await fetchLocations<VietnamProvince>(`${API_BASE}/`);
    const valid = provinces.filter(
      (province) =>
        Number.isFinite(province.code) && Boolean(province.name?.trim()),
    );
    if (!valid.length) throw new Error("Province list is empty");
    writeCache(PROVINCES_CACHE_KEY, valid);
    return { items: valid, fromFallback: false };
  } catch {
    return { items: fallbackProvinces, fromFallback: true };
  }
}

export async function loadWards(
  provinceCode: number,
): Promise<LocationResult<VietnamWard>> {
  const cacheKey = `${WARDS_CACHE_PREFIX}${provinceCode}`;
  const cached = readCache<VietnamWard>(cacheKey);
  if (cached?.length) return { items: cached, fromFallback: false };
  try {
    const wards = await fetchLocations<VietnamWard>(
      `${API_BASE}/w/?province=${provinceCode}`,
    );
    const valid = wards.filter(
      (ward) =>
        Number.isFinite(ward.code) &&
        ward.province_code === provinceCode &&
        Boolean(ward.name?.trim()),
    );
    if (!valid.length) throw new Error("Ward list is empty");
    writeCache(cacheKey, valid);
    return { items: valid, fromFallback: false };
  } catch {
    return { items: [], fromFallback: true };
  }
}

