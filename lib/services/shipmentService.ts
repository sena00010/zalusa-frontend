const API = process.env.NEXT_PUBLIC_API_URL ?? "";

// ─── Token ───────────────────────────────────────────────────────────────────

function getToken(): string {
  try {
    return localStorage.getItem("zalusa.token") ?? "";
  } catch {
    return "";
  }
}

// ─── Base Fetch Helpers ──────────────────────────────────────────────────────

async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) ?? {}),
    },
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `İstek başarısız (${res.status})`);
  }
  return data as T;
}

async function apiGet<T = any>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "GET" });
}

async function apiPost<T = any>(path: string, body: object): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

async function apiPut<T = any>(path: string, body: object): Promise<T> {
  return apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) });
}

async function apiDelete<T = any>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "DELETE" });
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApiPackage {
  widthCm: number;
  lengthCm: number;
  heightCm: number;
  weightKg: number;
  packageCount: number;
}

export interface ApiProformaItem {
  productDescription: string;
  hsCode: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  originCountry: string;
}

export interface ApiSaveMeasurement {
  label: string;
  widthCm: number;
  lengthCm: number;
  heightCm: number;
  weightKg: number;
}

export interface ApiCarrierQuote {
  carrierId: string;
  carrierName: string;
  serviceName: string;
  logoLetter: string;
  logoColor: string;
  logoUrl?: string;
  price: number;
  currency: string;
  priceTry: number;
  minTransitDays: number;
  maxTransitDays: number;
  deliveryLabel: string;
  returnCost: number;
  tags: string[];
}

export interface ApiDraft {
  shipmentId: number;
  trackingCode: string;
  currentStep: number;
  shipmentType: string;
  senderCountry: string;
  receiverCountry: string;
  receiverPostalCode: string;
  selectedCarrierId: string;
  carrierPrice: number;
  carrierCurrency: string;
  carrierPriceTry: number;
  hasInsurance: boolean;
  insuranceCost: number;
  senderAddressId: number;
  receiverAddressId: number;
  receiverName: string;
  receiverCompany: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity: string;
  proformaDescription: string;
  proformaCurrency: string;
  proformaIOSS: string;
  proformaTotal: number;
  packages: (ApiPackage & { volumetricWeightKg?: number; chargeableWeightKg?: number })[];
  proformaItems: (ApiProformaItem & { lineTotal?: number })[];
}
export type ApiAddress = {
  id: number;
  type: "sender" | "receiver";
  label: string;
  name: string;
  company: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  stateProvince: string;  // ← YENİ
  countryCode: string;
  isDefault: boolean;
};

export interface ApiMeasurement {
  id: number;
  label: string;
  widthCm: number;
  lengthCm: number;
  heightCm: number;
  weightKg: number;
}

// ─── Shipment List Types ─────────────────────────────────────────────────────

export interface ShipmentListItem {
  id: number;
  trackingCode: string;
  status: string;
  shipmentType: string;
  senderCountry: string;
  receiverCountry: string;
  receiverPostalCode: string;
  carrierName: string;
  serviceName: string;
  carrierLogoUrl?: string;
  carrierPrice: number;
  carrierCurrency: string;
  carrierPriceTry: number;
  originalPriceTry?: number;
  discountAmountTry?: number;
  hasInsurance: boolean;
  insuranceCost: number;
  proformaTotal: number;
  proformaCurrency: string;
  chargeableWeight: number;
  totalPackageCount: number;
  createdAt: string;
}

export interface ShipmentListResponse {
  shipments: ShipmentListItem[];
  total: number;
  page: number;
  limit: number;
}

// ─── Dashboard Types ─────────────────────────────────────────────────────────

export interface DashboardCountryStat {
  countryCode: string;
  count: number;
}

export interface DashboardRecentOrder {
  id: number;
  trackingCode: string;
  countryCode: string;
  status: string;
  priceTry: number;
  createdAt: string;
}

export interface DashboardStats {
  totalShipments: number;
  totalSpentTry: number;
  averageShipmentCostTry: number;
  deliveredShipments: number;
  uniqueCountriesCount: number;
  topCountries: DashboardCountryStat[];
  recentOrders: DashboardRecentOrder[];
}

// ─── Shipment Service ────────────────────────────────────────────────────────

export const shipmentService = {
  /** POST /api/shipments/draft — Adım 0: Taslak başlat */
  createDraft(payload: {
    shipmentType: "Belge" | "Paket" | "Koli";
    receiverCountry: string;
    receiverPostalCode: string;
  }) {
    return apiPost<{ shipmentId: number; trackingCode?: string; message: string; isExisting?: boolean }>(
      "/api/shipments/draft",
      payload
    );
  },

  /** GET /api/shipments/draft — Mevcut taslağı getir */
  getDraft() {
    return apiGet<{ draft: ApiDraft | null; message?: string }>("/api/shipments/draft");
  },

  /** GET /api/shipments/draft — Belirli bir taslağı ID ile getir (mevcut kullanıcının taslağını çekip ID eşleşmesini kontrol eder) */
  async getDraftById(id: number) {
    const res = await apiGet<{ draft: ApiDraft | null; message?: string }>("/api/shipments/draft");
    if (res.draft && res.draft.shipmentId === id) return res;
    return { draft: null, message: "Taslak bulunamadı" };
  },

  /** PUT /api/shipments/draft/:id — Taslağı adım adım güncelle */
  updateDraft(
    id: number,
    step: number,
    payload: Record<string, unknown>
  ) {
    return apiPut<{ message: string; step: number }>(
      `/api/shipments/draft/${id}`,
      { step, ...payload }
    );
  },

  /** POST /api/shipments/quotes — Kargo fiyatlarını sorgula */
  getQuotes(payload: {
    senderCountry: string;
    receiverCountry: string;
    receiverPostalCode?: string;
    packages: ApiPackage[];
    shipmentType?: string;
  }) {
    return apiPost<{ quotes: ApiCarrierQuote[]; chargeableWeight?: number; message?: string }>(
      "/api/shipments/quotes",
      payload
    );
  },

  /** POST /api/shipments/quick-create — Tek seferde kargo oluştur (Rule-Based) */
  quickCreate(payload: {
    shipmentType: "Belge" | "Paket" | "Koli";
    receiverCountry: string;
    receiverPostalCode: string;
    packages: ApiPackage[];
    selectedCarrierId: string;
    hasInsurance: boolean;
    senderAddressId?: number | null;
    senderName?: string;
    senderCompany?: string;
    senderPhone?: string;
    senderAddress?: string;
    senderCity?: string;
    saveSenderAddress?: boolean;
    receiverAddressId?: number | null;
    receiverName?: string;
    receiverCompany?: string;
    receiverPhone?: string;
    receiverAddress?: string;
    receiverCity?: string;
    saveReceiverAddress?: boolean;
    proformaDescription: string;
    proformaCurrency?: string;
    proformaIOSS?: string;
    proformaItems: Omit<ApiProformaItem, "sku">[];
    saveMeasurements?: ApiSaveMeasurement[];
    autoFinalize?: boolean;
  }) {
    return apiPost<{
      shipmentId: number;
      trackingCode: string;
      status: string;
      carrierPriceTry: number;
      insuranceCost: number;
      totalCost: number;
      chargeableWeight: number;
      totalPackages: number;
      proformaTotal: number;
      proformaCurrency: string;
      message: string;
    }>("/api/shipments/quick-create", payload);
  },

  /** GET /api/shipments — Kullanıcının gönderileri (sayfalı, filtrelenebilir) */
  list(params?: { status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return apiGet<ShipmentListResponse>(`/api/shipments${qs ? `?${qs}` : ""}`);
  },
};

// ─── Address Service ─────────────────────────────────────────────────────────

export const addressService = {
  list(type?: "sender" | "receiver") {
    const q = type ? `?type=${type}` : "";
    return apiGet<{ addresses: ApiAddress[] }>(`/api/addresses${q}`);
  },

  create(payload: {
    type: "sender" | "receiver";
    label: string;
    name: string;
    company?: string;
    phone?: string;
    address: string;
    postalCode?: string;
    city: string;
    stateProvince?: string;
    countryCode: string;
    isDefault?: boolean;
  }) {
    return apiPost<{ message: string; id: number }>("/api/addresses", payload);
  },

  delete(id: number) {
    return apiDelete<{ message: string }>(`/api/addresses/${id}`);
  },
};

// ─── Measurement Service ──────────────────────────────────────────────────────

export const measurementService = {
  list() {
    return apiGet<{ measurements: ApiMeasurement[] }>("/api/measurements");
  },

  create(payload: {
    label: string;
    widthCm: number;
    lengthCm: number;
    heightCm: number;
    weightKg: number;
  }) {
    return apiPost<{ message: string; id: number }>("/api/measurements", payload);
  },

  delete(id: number) {
    return apiDelete<{ message: string }>(`/api/measurements/${id}`);
  },
};

// ─── Dashboard Service ────────────────────────────────────────────────────────

export const dashboardService = {
  /** GET /api/dashboard/stats — Dashboard istatistikleri */
  getStats() {
    return apiGet<DashboardStats>("/api/dashboard/stats");
  },
};

// ─── City Service ─────────────────────────────────────────────────────────────

export interface ApiCity {
  id: number;
  cityName: string;
}

export interface CityListResponse {
  cities: ApiCity[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const cityService = {
  /** GET /api/cities?country=XX&search=abc&page=1&limit=20 */
  list(params: { country?: string; search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params.country) query.set("country", params.country);
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit ?? 20));
    const qs = query.toString();
    // Public endpoint — token gerekmez ama apiFetch kullanabiliriz
    return apiFetch<CityListResponse>(`/api/cities${qs ? `?${qs}` : ""}`, { method: "GET" });
  },
};

// ─── State Service ────────────────────────────────────────────────────────────

export interface ApiState {
  id: number;
  stateName: string;
}

export const stateService = {
  /** GET /api/states?country=XX */
  list(countryCode: string) {
    return apiFetch<{ states: ApiState[] }>(`/api/states?country=${encodeURIComponent(countryCode)}`, { method: "GET" });
  },
};

// ─── GTIP (HS Code) AI Service ────────────────────────────────────────────────

export interface GtipResponse {
  status: "cache" | "ai";
  hs_code: string;
  resolved_name: string;
  confidence_score: number;
}

export const gtipService = {
  /** GET /api/get-gtip?q={product_name} — AI destekli GTİP tahmin */
  predict(productName: string) {
    return apiGet<GtipResponse>(`/api/get-gtip?q=${encodeURIComponent(productName)}`);
  },
};

// ─── Document Upload Service (BunnyCDN) ───────────────────────────────────────

export interface UploadDocumentResponse {
  success: boolean;
  id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  url: string;
  message: string;
}

export interface ShipmentAttachment {
  id: number;
  shipment_id: number;
  file_type: string;
  file_name: string;
  storage_path: string;
  file_size: number;
  created_at: string;
}

export const documentService = {
  /** POST /api/upload-document — Multipart form data */
  async upload(file: File, shipmentId: number | string, fileType: string): Promise<UploadDocumentResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("shipment_id", String(shipmentId));
    formData.append("file_type", fileType);

    const res = await fetch(`${API}/api/upload-document`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Yükleme hatası" }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /** GET /api/shipment-attachments?shipment_id=XX */
  list(shipmentId: number | string) {
    return apiGet<{ attachments: ShipmentAttachment[] }>(`/api/shipment-attachments?shipment_id=${shipmentId}`);
  },
};