// ─── Dashboard Types ──────────────────────────────────────────────────────────

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
  createdAt: string; // ISO date string
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

// ─── Dashboard Service ────────────────────────────────────────────────────────

export const dashboardService = {
  getStats() {
    return apiGet<DashboardStats>("/api/dashboard/stats");
  },
};

async function apiGet<T = any>(path: string): Promise<T> {
  const token = localStorage.getItem("zalusa.token");
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API error: ${res.status}`);
  }

  return res.json();
}
