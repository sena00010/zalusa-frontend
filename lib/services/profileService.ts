// ─── Profile Types ────────────────────────────────────────────────────────────

export interface ApiProfile {
  id: number;
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  kind: "individual" | "corporate";
  tc: string;
  taxNo: string;
  taxOffice: string;
  address: string;
  isVerified: number;
  createdAt: string;
  updatedAt: string;
  profilePicture?: string;
  lastLogin?: string | null;
  totalShipments?: number;
  totalSpent?: number;
  reseller?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface ApiUpdateProfile {
  firstName: string;
  lastName: string;
  phone: string;
  tc: string;
  taxNo: string;
  taxOffice: string;
  address: string;
  profilePicture: string;
}

// ─── Profile Service ──────────────────────────────────────────────────────────

export const profileService = {
  get() {
    return apiGet<ApiProfile>("/api/profile");
  },

  update(payload: Partial<ApiUpdateProfile>) {
    return apiPut<{ message: string }>("/api/profile", payload);
  },

  /** PUT /api/profile/password — Mevcut şifreyle şifre değiştir */
  changePassword(payload: { currentPassword: string; newPassword: string }) {
    return apiPut<{ message: string }>("/api/profile/password", payload);
  },

  /** POST /api/auth/forgot-password — Şifre sıfırlama kodu gönder */
  forgotPassword(email: string) {
    return apiPost<{ message: string }>("/api/auth/forgot-password", { email });
  },

  /** POST /api/auth/verify-reset-code — Sıfırlama kodunu doğrula */
  verifyResetCode(email: string, code: string) {
    return apiPost<{ message: string }>("/api/auth/verify-reset-code", { email, code });
  },

  /** POST /api/auth/reset-password — Yeni şifre belirle */
  resetPassword(email: string, code: string, password: string) {
    return apiPost<{ message: string }>("/api/auth/reset-password", { email, code, password });
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

async function apiPut<T = any>(path: string, body: unknown): Promise<T> {
  const token = localStorage.getItem("zalusa.token");
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `API error: ${res.status}`);
  }

  return res.json();
}

async function apiPost<T = any>(path: string, body: unknown): Promise<T> {
  const token = localStorage.getItem("zalusa.token");
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `API error: ${res.status}`);
  }

  return res.json();
}

