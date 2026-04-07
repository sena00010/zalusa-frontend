// ─── Reseller Service ─────────────────────────────────────────────────────────
// B2B Bayi modülü API çağrıları

const API = process.env.NEXT_PUBLIC_API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WalletInfo {
  balance: number;
  totalEarned: number;
}

export interface WalletTransaction {
  id: number;
  type: "earning" | "payout";
  amount: number;
  description: string;
  createdAt: string; // ISO date
}

export interface AdminCouponInfo {
  id: number;
  code: string;
  discountPct: number;
  creatorType: string;
  isActive: boolean;
  usageLimit: number;
  usedCount: number;
  createdAt: string;
  expiresAt: string | null;
}

export interface ResellerDashboardData {
  wallet: WalletInfo;
  transactions: WalletTransaction[];
  commissionRate: number;
  discountAllowance: number;
  customerCount: number;
  adminCoupons: AdminCouponInfo[];
}

export interface ResellerListItem {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  commissionRate: number;
  discountAllowance: number;
  balance: number;
  totalEarned: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToken(): string {
  return localStorage.getItem("zalusa.token") || "";
}

async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API hatası: ${res.status}`);
  }
  return res.json();
}

async function apiPut<T = unknown>(path: string, body: object): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API hatası: ${res.status}`);
  }
  return res.json();
}

async function apiPost<T = unknown>(path: string, body?: object): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API hatası: ${res.status}`);
  }
  return res.json();
}

async function adminGet<T = unknown>(path: string): Promise<T> {
  const token = localStorage.getItem("zalusa.admin.token") || "";
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API hatası: ${res.status}`);
  }
  return res.json();
}

async function adminPost<T = unknown>(path: string, body?: object): Promise<T> {
  const token = localStorage.getItem("zalusa.admin.token") || "";
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API hatası: ${res.status}`);
  }
  return res.json();
}

// ─── Service ──────────────────────────────────────────────────────────────────

export interface ResellerCustomer {
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
}

// ─── Coupon Types ─────────────────────────────────────────────────────────────

export interface ResellerCoupon {
  id: number;
  code: string;
  discountPct: number;
  creatorType: string;
  owner: string;
  isActive: boolean;
  usageLimit: number;
  usedCount: number;
  createdAt: string;
  expiresAt: string | null;
}

// ─── PATCH helper ─────────────────────────────────────────────────────────────

async function apiPatch<T = unknown>(path: string, body: object): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API hatası: ${res.status}`);
  }
  return res.json();
}

async function apiDelete<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API hatası: ${res.status}`);
  }
  return res.json();
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const resellerService = {
  /** Bayi dashboard: cüzdan bilgisi + son 10 işlem */
  getDashboard: () => apiGet<ResellerDashboardData>("/api/reseller/dashboard"),

  /** Bayi indirim oranı güncelle */
  updateSettings: (discountAllowance: number) =>
    apiPut<{ message: string; discountAllowance: number }>(
      "/api/reseller/settings",
      { discountAllowance }
    ),

  /** Bayinin müşteri listesi */
  listCustomers: () =>
    apiGet<{ customers: ResellerCustomer[]; total: number }>(
      "/api/reseller/customers"
    ),

  /** Bayi yeni müşteri oluştur */
  createCustomer: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
  }) =>
    apiPost<{ message: string; id: number; customerId: string }>(
      "/api/reseller/customers",
      data
    ),

  /** Mevcut müşteriye bağlama kodu gönder */
  linkRequest: (email: string) =>
    apiPost<{ message: string }>("/api/reseller/link-request", { email }),

  /** Bağlama kodunu doğrula */
  /** Müşteri bağını çöz (çıkar) */
  unlinkCustomer: (customerId: number) =>
    apiDelete<{ message: string }>(`/api/reseller/customers/${customerId}`),

  linkVerify: (email: string, code: string) =>
    apiPost<{ message: string }>("/api/reseller/link-verify", { email, code }),

  // ─── Kupon Yönetimi ──────────────────────────────────────────────────────

  /** Bayi yeni kupon oluştur */
  createCoupon: (data: {
    code: string;
    discountPct: number;
    usageLimit?: number | null;
    expiresAt?: string | null;
  }) =>
    apiPost<{ message: string; id: number; code: string; discountPct: number }>(
      "/api/reseller/coupons",
      data
    ),

  /** Bayinin kuponlarını listele */
  listCoupons: () =>
    apiGet<{ coupons: ResellerCoupon[]; total: number }>(
      "/api/reseller/coupons"
    ),

  /** Kupon aktif/pasif yap */
  updateCouponStatus: (couponId: number, isActive: boolean) =>
    apiPatch<{ message: string; isActive: boolean }>(
      `/api/reseller/coupons/${couponId}/status`,
      { isActive }
    ),

  /** Kupon sil */
  deleteCoupon: (couponId: number) =>
    apiDelete<{ message: string }>(`/api/reseller/coupons/${couponId}`),

  /** Admin: tüm bayileri listele */
  adminListResellers: () =>
    adminGet<ResellerListItem[]>("/api/admin/resellers"),

  /** Admin: bayiye payout yap */
  adminPayout: (resellerId: number) =>
    adminPost<{ message: string; paidAmount: number }>(
      `/api/admin/resellers/${resellerId}/payout`
    ),
};
