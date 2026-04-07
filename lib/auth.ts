export type UserKind = "individual" | "corporate";

export type InvoiceInfo =
  | {
      kind: "individual";
      tc: string;
      address: string;
    }
  | {
      kind: "corporate";
      taxNo: string;
      taxOffice: string;
      address: string;
    };

export type User = {
  customerId: string; // 10-digit numeric string
  kind: UserKind;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  verified: boolean;
  invoice: InvoiceInfo;
  createdAt: string;
  updatedAt: string;
};

type Verification = {
  email: string;
  code: string;
  expiresAt: string;
};

const USERS_KEY = "zalusa.auth.users";
const CURRENT_KEY = "zalusa.auth.currentUserEmail";
const VERIFICATION_KEY = "zalusa.auth.verification";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

export function generateCustomerId() {
  let s = "";
  for (let i = 0; i < 10; i++) s += Math.floor(Math.random() * 10).toString();
  if (s[0] === "0") s = "1" + s.slice(1);
  return s;
}

export function getUsers(): User[] {
  return safeParse<User[]>(globalThis.localStorage?.getItem(USERS_KEY) ?? null, []);
}

function setUsers(users: User[]) {
  globalThis.localStorage?.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser(): User | null {
  const email = globalThis.localStorage?.getItem(CURRENT_KEY) ?? "";
  if (!email) return null;
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function setCurrentUserEmail(email: string | null) {
  if (!email) globalThis.localStorage?.removeItem(CURRENT_KEY);
  else globalThis.localStorage?.setItem(CURRENT_KEY, email);
}

export function logout() {
  setCurrentUserEmail(null);
}

export function upsertUser(user: User) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (idx >= 0) users[idx] = user;
  else users.unshift(user);
  setUsers(users);
}

export function requestVerification(email: string) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const v: Verification = {
    email,
    code,
    expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
  };
  globalThis.localStorage?.setItem(VERIFICATION_KEY, JSON.stringify(v));
  return v;
}

export function getVerification(): Verification | null {
  const v = safeParse<Verification | null>(
    globalThis.localStorage?.getItem(VERIFICATION_KEY) ?? null,
    null,
  );
  if (!v) return null;
  if (new Date(v.expiresAt).getTime() < Date.now()) return null;
  return v;
}

export function verifyCode(email: string, code: string) {
  const v = getVerification();
  if (!v) return { ok: false as const, reason: "expired" as const };
  if (v.email.toLowerCase() !== email.toLowerCase()) {
    return { ok: false as const, reason: "mismatch" as const };
  }
  if (v.code !== code) return { ok: false as const, reason: "invalid" as const };

  const users = getUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  if (idx >= 0) {
    users[idx] = { ...users[idx], verified: true, updatedAt: nowIso() };
    setUsers(users);
  }
  globalThis.localStorage?.removeItem(VERIFICATION_KEY);
  setCurrentUserEmail(email);
  return { ok: true as const };
}

export function registerUser(input: {
  kind: UserKind;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  invoice: InvoiceInfo;
}) {
  const email = input.email.trim().toLowerCase();
  const users = getUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email) ?? null;
  if (existing) {
    setCurrentUserEmail(email);
    return { ok: true as const, user: existing };
  }

  const user: User = {
    customerId: generateCustomerId(),
    kind: input.kind,
    fullName: input.fullName.trim() || email.split("@")[0] || "Kullanıcı",
    email,
    phone: input.phone.trim(),
    password: input.password,
    verified: true,
    invoice: input.invoice,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  setUsers([user, ...users]);
  setCurrentUserEmail(email);
  return { ok: true as const, user };
}

export function loginUser(email: string, password: string) {
  const e = email.trim().toLowerCase();
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === e) ?? null;
  if (user) {
    setCurrentUserEmail(e);
    return { ok: true as const, user };
  }

  const created: User = {
    customerId: generateCustomerId(),
    kind: "individual",
    fullName: e.split("@")[0] || "Kullanıcı",
    email: e,
    phone: "",
    password,
    verified: true,
    invoice: { kind: "individual", tc: "", address: "" },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  setUsers([created, ...users]);
  setCurrentUserEmail(e);
  return { ok: true as const, user: created };
}

export function updateProfile(input: {
  email: string;
  fullName: string;
  phone: string;
  invoice: InvoiceInfo;
}) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === input.email.toLowerCase());
  if (idx < 0) return { ok: false as const };
  users[idx] = {
    ...users[idx],
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    invoice: input.invoice,
    updatedAt: nowIso(),
  };
  setUsers(users);
  return { ok: true as const, user: users[idx] };
}

