// Lightweight client for the main Conddo API (api.getconddo.com). Distinct
// from lib/api.ts (which talks to Studio's own /api/jobs backend) — Studio's
// single-page platform dashboard reads cross-tenant data from the main
// service via SUPER_ADMIN Bearer tokens issued by /auth/login.
//
// Auth model:
//   - User signs in with their PlatformSuperAdminBootstrap credentials
//     (env-var seeded, kept in the platform owner's password manager).
//   - We call POST /auth/login on api.getconddo.com; response includes
//     accessToken with role=SUPER_ADMIN claim.
//   - Token is cached in localStorage under CONDDO_ADMIN_TOKEN and used as
//     Bearer for every subsequent admin call.
//
// This intentionally does NOT replace lib/auth.ts (Studio's own auth flow);
// they run in parallel so Studio-specific endpoints keep working if we ever
// reintroduce them.

const ROOT = process.env.NEXT_PUBLIC_CONDDO_API_URL ?? "";
const BASE = `${ROOT}/api/v1`;

const TOKEN_KEY = "CONDDO_ADMIN_TOKEN";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ConddoApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 0) {
    super(message);
    this.name = "ConddoApiError";
    this.code = code;
    this.status = status;
  }
}

type Envelope<T> = { success: boolean; data: T; error?: { code: string; message: string } };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!ROOT) {
    throw new ConddoApiError("api_not_configured",
      "NEXT_PUBLIC_CONDDO_API_URL is unset — the Studio dashboard needs to know where the main Conddo API lives.");
  }
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAdminToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, { ...init, headers, cache: "no-store" });
  const status = res.status;
  let payload: Envelope<T> | null = null;
  try {
    payload = (await res.json()) as Envelope<T>;
  } catch {
    // No JSON body — surface a generic error.
  }
  if (!res.ok || (payload && !payload.success)) {
    const code = payload?.error?.code ?? `http_${status}`;
    const message = payload?.error?.message ?? `Request to ${path} failed (${status})`;
    if (status === 401) clearAdminToken();
    throw new ConddoApiError(code, message, status);
  }
  return (payload?.data as T);
}

/** POST /auth/staff/login on the main API — separate from tenant /auth/login.
 *  Staff users live in the global (non-RLS) staff_users table, are not
 *  tenant-scoped, and log in with just email + password. SUPER_ADMIN role
 *  gates the /admin/* surfaces. */
export async function loginAdmin(input: { email: string; password: string })
: Promise<{ accessToken: string; role: string; userId: string }> {
  const res = await fetch(`${ROOT}/auth/staff/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  const payload = await res.json();
  if (!res.ok || !payload.success) {
    throw new ConddoApiError(
      payload.error?.code ?? `http_${res.status}`,
      payload.error?.message ?? "Login failed",
      res.status,
    );
  }
  setAdminToken(payload.data.accessToken);
  return payload.data;
}

// ----- Domain types -------------------------------------------------------

export type PlatformOverview = {
  totalTenants: number;
  newTenantsLast30Days: number;
  pendingQaCount: number;
  activeSitesCount: number;
  totalCreditsUsedPlatformWide: number;
  tenantsByVertical: Record<string, number>;
  tenantsByTier: Record<string, number>;
};

export type TenantSiteAdminRow = {
  id: string;
  tenantId: string;
  subdomain: string | null;
  customDomain: string | null;
  submittedUrl: string | null;
  siteType: string | null;
  hostingProvider: string | null;
  active: boolean;
  qaApproved: boolean;
  qaApprovedAt: string | null;
  createdAt: string;
};

// ----- API surface --------------------------------------------------------

export const conddoAdminApi = {
  overview: () => request<PlatformOverview>("/admin/platform/overview"),
  pendingSites: () => request<TenantSiteAdminRow[]>("/admin/sites?filter=pending"),
  approveSite: (siteId: string) =>
    request<TenantSiteAdminRow>(`/admin/sites/${siteId}/approve`, { method: "POST" }),
};
