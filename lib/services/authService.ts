const API = process.env.NEXT_PUBLIC_API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserKind = "individual" | "corporate";

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  kind: UserKind;
  tc?: string;
  taxNo?: string;
  taxOffice?: string;
  address?: string;
  kvkkAccepted: boolean;
  mailConsent: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyResetCodePayload {
  email: string;
  code: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  password: string;
}

export interface GoogleSignInPayload {
  idToken: string;
}

export interface AuthResponse {
  token: string;
  customerId: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function post<T = any>(path: string, body: object): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || `İstek başarısız (${res.status})`);
  }

  return data as T;
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  register: (payload: RegisterPayload) =>
    post<{ message: string; customerId: string }>("/api/auth/register", payload),

  verifyEmail: (payload: VerifyEmailPayload) =>
    post<{ message: string }>("/api/auth/verify-email", payload),

  resendVerification: (payload: ForgotPasswordPayload) =>
    post<{ message: string }>("/api/auth/resend-verification", payload),

  login: (payload: LoginPayload) =>
    post<AuthResponse>("/api/auth/login", payload),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    post<{ message: string }>("/api/auth/forgot-password", payload),

  verifyResetCode: (payload: VerifyResetCodePayload) =>
    post<{ message: string }>("/api/auth/verify-reset-code", payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    post<{ message: string }>("/api/auth/reset-password", payload),

  googleSignIn: (payload: GoogleSignInPayload) =>
    post<AuthResponse>("/api/auth/google", payload),
};
