// Studio Platform Admin (§23) — cross-tenant management.
// Read endpoints: ADMIN-gated on the backend (NOT TEAM_LEAD — large blast radius).
// Mutation endpoints: ADMIN-gated; some refuse last-admin demote with 422 LAST_ADMIN_PROTECTED.
//
// Phase 13a (read): list/search tenants, get tenant + counts, users-for-tenant, global
//   user search, get user with tenant summary.
// Phase 13b (mutations): suspend/reactivate/soft-delete tenants, role/active patch + soft-delete
//   on users, force-password-reset.
import { api } from "./api";
import type { PlatformTenant, PlatformUser } from "@/types";

export type TenantListParams = {
  q?: string;
  status?: "ACTIVE" | "SUSPENDED" | "DELETED";
  page?: number;
  size?: number;
};

export type UserListParams = {
  q?: string;
  tenantId?: string;
  role?: string;
  page?: number;
  size?: number;
};

export type UpdateTenantInput = Partial<{
  name: string;
  planId: string;
  status: "ACTIVE" | "SUSPENDED";
}>;

export type UpdateUserInput = Partial<{
  role: string;
  active: boolean;
  fullName: string;
}>;

function qs(p: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && v !== "") params.set(k, String(v));
  }
  return params.toString();
}

export const platformAdminApi = {
  // ----- tenants -----
  listTenants: (p: TenantListParams = {}) =>
    api.get<PlatformTenant[]>(`/admin/platform/tenants?${qs({ q: p.q, status: p.status, page: p.page ?? 0, size: p.size ?? 25 })}`),
  getTenant: (id: string) => api.get<PlatformTenant>(`/admin/platform/tenants/${id}`),
  usersForTenant: (id: string) => api.get<PlatformUser[]>(`/admin/platform/tenants/${id}/users`),
  updateTenant: (id: string, body: UpdateTenantInput) =>
    api.patch<PlatformTenant>(`/admin/platform/tenants/${id}`, body),
  /** Soft-delete: flips status to DELETED and revokes the tenant's sessions. */
  deleteTenant: (id: string) => api.del<void>(`/admin/platform/tenants/${id}`),

  // ----- users -----
  listUsers: (p: UserListParams = {}) =>
    api.get<PlatformUser[]>(`/admin/platform/users?${qs({ q: p.q, tenantId: p.tenantId, role: p.role, page: p.page ?? 0, size: p.size ?? 25 })}`),
  getUser: (id: string) => api.get<PlatformUser>(`/admin/platform/users/${id}`),
  updateUser: (id: string, body: UpdateUserInput) =>
    api.patch<PlatformUser>(`/admin/platform/users/${id}`, body),
  /** Triggers /auth/forgot-password on the platform side — user gets the email. */
  resetUserPassword: (id: string) =>
    api.post<void>(`/admin/platform/users/${id}/reset-password`),
  /** Soft-delete a user — deactivate + revoke sessions. Subject to LAST_ADMIN_PROTECTED. */
  deleteUser: (id: string) => api.del<void>(`/admin/platform/users/${id}`),
};
