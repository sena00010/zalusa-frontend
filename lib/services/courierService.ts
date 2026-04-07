const API = process.env.NEXT_PUBLIC_API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CourierPickup {
  id: number;
  pickupCode: string;
  pickupDate: string;
  contactPerson: string;
  contactPhone: string;
  status: string;
  statusLabel: string;
  cancelReason: string;
  note: string;
  createdAt: string;
  carrierId: string;
  carrierName: string;
  shipmentId: number;
  trackingCode: string;
  addressLabel: string;
  addressText: string;
}

export interface CourierPickupDetail extends CourierPickup {
  address: {
    id: number;
    label: string;
    address: string;
    city: string;
    phone: string;
  };
}

export interface CreatePickupPayload {
  shipmentId: number;
  addressId: number;
  pickupDate: string;
  contactPerson: string;
  contactPhone: string;
  note?: string;
}

export interface CancelPickupPayload {
  reason?: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("zalusa.token") || "";
}

async function authFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || `İstek başarısız (${res.status})`);
  }

  return data as T;
}

// ─── Courier Pickup Service ───────────────────────────────────────────────────

export const courierService = {
  // Yeni kurye kaydı oluştur
  create: (payload: CreatePickupPayload) =>
    authFetch<{ message: string; pickupId: number; pickupCode: string }>("/api/courier-pickups", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Kurye kayıtlarını listele (arama + sayfalama)
  list: (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return authFetch<{ pickups: CourierPickup[]; total: number; page: number; limit: number }>(
      `/api/courier-pickups${qs ? `?${qs}` : ""}`
    );
  },

  // Tek kurye kaydı detayı
  get: (id: number) =>
    authFetch<CourierPickupDetail>(`/api/courier-pickups/${id}`),

  // Kurye kaydını iptal et
  cancel: (id: number, payload?: CancelPickupPayload) =>
    authFetch<{ message: string }>(`/api/courier-pickups/${id}/cancel`, {
      method: "PUT",
      body: JSON.stringify(payload || {}),
    }),
};