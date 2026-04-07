const API = process.env.NEXT_PUBLIC_API_URL;

const ADMIN_TOKEN_KEY = "zalusa.admin.token";

function getToken(): string | null {
  return globalThis.localStorage?.getItem(ADMIN_TOKEN_KEY) ?? null;
}

async function request<T = any>(
  method: string,
  path: string,
  body?: object,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || `İstek başarısız (${res.status})`);
  }

  return data as T;
}

function get<T = any>(path: string) {
  return request<T>("GET", path);
}
function post<T = any>(path: string, body: object) {
  return request<T>("POST", path, body);
}
function put<T = any>(path: string, body: object) {
  return request<T>("PUT", path, body);
}
function del<T = any>(path: string) {
  return request<T>("DELETE", path);
}
function patch<T = any>(path: string, body: object) {
  return request<T>("PATCH", path, body);
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface Carrier {
  id: string;
  carrierName: string;
  serviceName: string;
  logoLetter: string;
  logoColor: string;
  logoUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface CarrierRate {
  id: number;
  carrierId: string;
  zone: string;
  weightMinKg: number;
  weightMaxKg: number;
  basePrice: number;
  perKgPrice: number;
  currency: string;
  fuelSurchargePct: number;
  minTransitDays: number;
  maxTransitDays: number;
  validFrom: string;
  validTo: string | null;
}

export interface CarrierZone {
  id: number;
  carrierId: string;
  originCountry: string;
  destCountry: string;
  destPostalPrefix: string | null;
  zone: string;
}

export interface ExchangeRate {
  id: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  markup: number;
  finalRate: number;
  updatedAt: string;
}

export interface ShipmentDescriptionType {
  id: number;
  label: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface HelpItem {
  id: number;
  title: string;
  description: string;
  icon: string;
  badge: string | null;
  external: boolean;
  link: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourierPickup {
  id: number;
  pickupCode: string;
  pickupDate: string;
  status: string;
  contactPerson: string;
  contactPhone: string;
  note: string;
  cancelReason: string | null;
  carrierId: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  userEmail: string;
  firstName: string;
  lastName: string;
  customerId: string;
  trackingCode: string;
  [key: string]: any;
}

export interface CustomerUser {
  id: number;
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  kind: string;
  isVerified: boolean;
  isActive: boolean;
  role: string;
  createdAt: string;
}

export interface UserShipment {
  id: number;
  trackingCode: string;
  status: string;
  statusLabel: string;
  currentStep: number;
  shipmentType: string;
  senderCountry: string;
  receiverCountry: string;
  receiverPostal: string;
  carrierId: string;
  carrierPriceTry: number;
  hasInsurance: boolean;
  chargeableWeight: number;
  packageCount: number;
  carrierName: string;
  serviceName: string;
  carrierLogoUrl: string;
  createdAt: string;
}

export interface MarginRule {
  id: number;
  ruleType: "global" | "specific";
  carrierId: string | null;
  carrierName?: string;
  minDesi: number | null;
  maxDesi: number | null;
  marginType: "percentage" | "fixed";
  marginValue: number;
  isActive: boolean;
  createdAt: string;
}

export interface CourierStats {
  [key: string]: any;
}

export interface LiveChat {
  id: number;
  userId: number;
  adminId: number | null;
  status: "waiting" | "active" | "closed";
  createdAt: string;
  closedAt: string | null;
  userName: string;
  messageCount: number;
  lastMessage: string | null;
}

export interface LiveChatMessage {
  id: number;
  chatId: number;
  sender: "user" | "admin" | "system";
  content: string;
  createdAt: string;
}

// ── Public helper (no auth) ──────────────────────────────────────────────────

async function publicPost<T = any>(path: string, body: object): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `İstek başarısız (${res.status})`);
  return data as T;
}

// ── Admin Service ────────────────────────────────────────────────────────────

export const adminService = {
  // ── Auth ───────────────────────────────────────────
  login: (payload: { email: string; password: string }) =>
    publicPost<{ token: string }>("/api/admin/login", payload),

  register: (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => publicPost<{ message: string; adminId: number }>("/api/admin/admins", payload),

  getMe: () => get<AdminUser>("/api/admin/me"),

  changeMyPassword: (payload: { oldPassword: string; newPassword: string }) =>
    put<{ message: string }>("/api/admin/me/password", payload),

  // ── Admin Management ──────────────────────────────
  listAdmins: () => get<AdminUser[]>("/api/admin/admins"),

  createAdmin: (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => post<{ message: string }>("/api/admin/admins", payload),

  changeAdminPassword: (id: string, payload: { password: string }) =>
    put<{ message: string }>(`/api/admin/admins/${id}/password`, payload),

  updateAdminStatus: (id: string, payload: { isActive: boolean }) =>
    put<{ message: string }>(`/api/admin/admins/${id}/status`, payload),

  // ── Courier Pickups ───────────────────────────────
  getCourierStats: () => get<CourierStats>("/api/admin/courier-pickups/stats"),

  listCourierPickups: async (): Promise<CourierPickup[]> => {
    const res = await get<{ data: CourierPickup[]; limit: number; page: number }>("/api/admin/courier-pickups");
    return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
  },

  updateCourierStatus: (
    id: number,
    payload: { status: string },
  ) => put<{ message: string }>(`/api/admin/courier-pickups/${id}/status`, payload),

  // ── Carriers ──────────────────────────────────────
  listCarriers: () => get<Carrier[]>("/api/admin/carriers"),

  createCarrier: (payload: {
    id: string;
    carrierName: string;
    serviceName: string;
    logoLetter?: string;
    logoColor: string;
    logoUrl?: string;
  }) => post<{ message: string; id: string }>("/api/admin/carriers", payload),

  updateCarrierStatus: (id: string, payload: { isActive: boolean }) =>
    put<{ message: string }>(`/api/admin/carriers/${id}/status`, payload),

  updateCarrier: (id: string, payload: {
    carrierName?: string;
    serviceName?: string;
    logoLetter?: string;
    logoColor?: string;
    logoUrl?: string;
  }) => put<{ message: string }>(`/api/admin/carriers/${id}`, payload),

  // ── Carrier Rates ─────────────────────────────────
  listCarrierRates: (carrierId: string) =>
    get<CarrierRate[]>(`/api/admin/carriers/${carrierId}/rates`),

  createCarrierRate: (carrierId: string, payload: Omit<CarrierRate, "id" | "carrierId">) =>
    post<{ message: string; rateId: number }>(
      `/api/admin/carriers/${carrierId}/rates`,
      payload,
    ),

  updateCarrierRate: (rateId: number, payload: Partial<CarrierRate>) =>
    put<{ message: string }>(`/api/admin/carriers/rates/${rateId}`, payload),

  deleteCarrierRate: (rateId: number) =>
    del<{ message: string }>(`/api/admin/carriers/rates/${rateId}`),

  // ── Carrier Zones ─────────────────────────────────
  listCarrierZones: (carrierId: string) =>
    get<CarrierZone[]>(`/api/admin/carriers/${carrierId}/zones`),

  createCarrierZone: (
    carrierId: string,
    payload: Omit<CarrierZone, "id" | "carrierId">,
  ) =>
    post<{ message: string; zoneId: number }>(
      `/api/admin/carriers/${carrierId}/zones`,
      payload,
    ),

  deleteCarrierZone: (zoneId: number) =>
    del<{ message: string }>(`/api/admin/carriers/zones/${zoneId}`),

  // ── Exchange Rates ────────────────────────────────
  listExchangeRates: () => get<ExchangeRate[]>("/api/admin/exchange-rates"),

  updateExchangeRate: (id: number, payload: { rate: number }) =>
    put<{ message: string }>(`/api/admin/exchange-rates/${id}`, payload),

  updateExchangeRateMarkup: (id: number, payload: { markup: number }) =>
    patch<{ message: string }>(`/api/admin/exchange-rates/${id}/markup`, payload),

  syncExchangeRates: () =>
    post<{ message: string }>("/api/admin/exchange-rates/sync", {}),

  // ── Shipment Description Types ────────────────────
  listShipmentDescriptionTypes: () =>
    get<{ types: ShipmentDescriptionType[] }>("/api/admin/shipment-description-types"),

  createShipmentDescriptionType: (payload: { label: string; sortOrder?: number }) =>
    post<{ message: string; id: number }>("/api/admin/shipment-description-types", payload),

  updateShipmentDescriptionType: (
    id: number,
    payload: { label: string; isActive?: boolean; sortOrder?: number },
  ) => put<{ message: string }>(`/api/admin/shipment-description-types/${id}`, payload),

  deleteShipmentDescriptionType: (id: number) =>
    del<{ message: string }>(`/api/admin/shipment-description-types/${id}`),

  // ── Help Items ──────────────────────────────────────
  listHelpItems: () => get<HelpItem[]>("/api/admin/help-items"),

  createHelpItem: (payload: {
    title: string;
    description: string;
    icon: string;
    badge?: string | null;
    external: boolean;
    link?: string | null;
    sortOrder: number;
  }) => post<{ message: string; id: number }>("/api/admin/help-items", payload),

  updateHelpItem: (
    id: number,
    payload: {
      title: string;
      description: string;
      icon: string;
      badge?: string | null;
      external: boolean;
      link?: string | null;
      sortOrder: number;
      isActive: boolean;
    },
  ) => put<{ message: string }>(`/api/admin/help-items/${id}`, payload),

  deleteHelpItem: (id: number) =>
    del<{ message: string }>(`/api/admin/help-items/${id}`),

  updateHelpItemStatus: (id: number, payload: { isActive: boolean }) =>
    put<{ message: string }>(`/api/admin/help-items/${id}/status`, payload),

  // ── Live Support ─────────────────────────────────────
  listLiveChats: () => get<{ chats: LiveChat[] }>("/api/admin/live-support/chats"),

  getLiveChatMessages: (chatId: number) =>
    get<{ messages: LiveChatMessage[] }>(`/api/admin/live-support/chats/${chatId}/messages`),

  closeLiveChat: (chatId: number) =>
    put<{ message: string }>(`/api/admin/live-support/chats/${chatId}/close`, {}),

  listClosedLiveChats: () =>
    get<{ chats: LiveChat[] }>("/api/admin/live-support/chats/closed"),

  // ── Kullanıcı (Müşteri) Yönetimi ──────────────────────────
  listUsers: (page = 1, limit = 20, search = "") =>
    get<{
      users: CustomerUser[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/admin/users?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}`),

  getUserShipments: (userId: number, status?: string) =>
    get<{
      user: {
        id: number;
        customerId: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        kind: string;
        isVerified: boolean;
        isActive: boolean;
        createdAt: string;
      };
      shipments: UserShipment[];
      total: number;
      draftCount: number;
      pendingCount: number;
      summary: string;
    }>(`/api/admin/users/${userId}/shipments${status ? `?status=${status}` : ""}`),

  // ── Kâr Marjı Kuralları (Margin Rules) ─────────────────────
  listMarginRules: () =>
    get<{ rules: MarginRule[] }>("/api/admin/margin-rules"),

  createMarginRule: (payload: {
    ruleType: string;
    carrierId?: string | null;
    minDesi?: number | null;
    maxDesi?: number | null;
    marginType: string;
    marginValue: number;
    isActive?: boolean;
  }) => post<{ message: string; id: number }>("/api/admin/margin-rules", payload),

  updateMarginRule: (
    id: number,
    payload: {
      ruleType: string;
      carrierId?: string | null;
      minDesi?: number | null;
      maxDesi?: number | null;
      marginType: string;
      marginValue: number;
      isActive?: boolean;
    },
  ) => put<{ message: string }>(`/api/admin/margin-rules/${id}`, payload),

  deleteMarginRule: (id: number) =>
    del<{ message: string }>(`/api/admin/margin-rules/${id}`),

  // ── Kullanıcı Rol Yönetimi (Bayi Yap / Düşür) ─────────────────────
  updateUserRole: (
    userId: number,
    payload: { role: "user" | "reseller"; commissionRate?: number },
  ) => put<{ message: string; role: string; commissionRate?: number }>(
    `/api/admin/users/${userId}/role`,
    payload,
  ),

  // ── Bayi Yönetimi ─────────────────────────────────────────────────
  createReseller: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    commissionRate: number;
  }) => post<{ message: string; id: number; customerId: string }>(
    "/api/admin/resellers",
    payload,
  ),

  getResellerDetail: (id: number) =>
    get<{
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      customerId: string;
      commissionRate: number;
      discountAllowance: number;
      balance: number;
      totalEarned: number;
      customerCount: number;
      couponCount: number;
      createdAt: string;
      transactions: Array<{
        id: number;
        type: string;
        amount: number;
        description: string;
        createdAt: string;
      }>;
    }>(`/api/admin/resellers/${id}`),

  updateReseller: (
    id: number,
    payload: { commissionRate?: number; discountAllowance?: number },
  ) => put<{ message: string }>(`/api/admin/resellers/${id}`, payload),

  getResellerCustomers: (id: number) =>
    get<{
      customers: Array<{
        id: number;
        customerId: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        kind: string;
        isActive: boolean;
        shipmentCount: number;
        createdAt: string;
      }>;
      total: number;
    }>(`/api/admin/resellers/${id}/customers`),

  getResellerCustomerShipments: (resellerId: number, custId: number) =>
    get<{
      shipments: Array<{
        id: number;
        trackingCode: string;
        status: string;
        statusLabel: string;
        shipmentType: string;
        senderCountry: string;
        receiverCountry: string;
        carrierPriceTry: number;
        weight: number;
        carrierName: string;
        serviceName: string;
        createdAt: string;
      }>;
      total: number;
    }>(`/api/admin/resellers/${resellerId}/customers/${custId}/shipments`),

  linkExistingCustomer: (resellerId: number, email: string) =>
    post<{ message: string }>(`/api/admin/resellers/${resellerId}/customers/link`, { email }),

  // ── Kupon Yönetimi ────────────────────────────────────────────────
  createCoupon: (
    resellerId: number,
    payload: {
      code: string;
      discountPct: number;
      usageLimit?: number | null;
      validUntil?: string | null;
    },
  ) => post<{ message: string; id: number }>(
    `/api/admin/resellers/${resellerId}/coupons`,
    payload,
  ),

  getResellerCoupons: (resellerId: number) =>
    get<{
      coupons: Array<{
        id: number;
        code: string;
        discountPct: number;
        usageLimit: number | null;
        usedCount: number;
        validFrom: string;
        validUntil: string | null;
        isActive: boolean;
        createdAt: string;
      }>;
      total: number;
    }>(`/api/admin/resellers/${resellerId}/coupons`),

  deleteCoupon: (couponId: number) =>
    del<{ message: string }>(`/api/admin/coupons/${couponId}`),

  updateCouponStatus: (couponId: number, isActive: boolean) =>
    put<{ message: string }>(`/api/admin/coupons/${couponId}/status`, { isActive }),
};
