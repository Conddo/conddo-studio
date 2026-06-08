// Site Registration admin — /api/jobs/admin/platform/sites/*.
// Spec: backend/SITE_REGISTRATION_ADMIN_SPEC.md.
//
// Ops registers a tenant_sites row + issues a Site API Key here, instead of
// the SQL-and-Slack handover we did before this shipped. Plaintext keys come
// back exactly once on register + rotate; the rest of the time only the
// masked sk_live_••••••a3f2 form is retrievable.

import { api } from "./api";

export type HostingProvider = "conddo" | "vercel" | "9stacks";
export type SiteType = "custom_built" | "template";

/** Table-row sized — matches the BE's TenantSiteSummary. */
export type TenantSiteSummary = {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantVertical: string | null;
  subdomain: string | null;
  customDomain: string | null;
  hostingProvider: HostingProvider | null;
  siteType: SiteType | null;
  apiKeyLast4: string;
  isActive: boolean;
  qaApproved: boolean;
  createdAt: string;
  qaApprovedAt: string | null;
};

/** Single-row detail — adds submittedUrl, audit timestamps, who-did-what. */
export type TenantSiteDetail = TenantSiteSummary & {
  submittedUrl: string | null;
  qaApprovedBy: string | null;
  qaApprovedByName: string | null;
  lastKeyRotatedAt: string | null;
  lastKeyRotatedBy: string | null;
  updatedAt: string;
};

/** Plaintext key returned ONCE on register + rotate. After this response,
 *  only apiKeyLast4 is retrievable — store the key client-side just long
 *  enough to show it to the user, then drop the reference. */
export type SiteWithKey = {
  site: TenantSiteDetail;
  apiKey: string;
};

export type SiteAuditAction =
  | "REGISTERED" | "KEY_ROTATED" | "QA_APPROVED" | "QA_REVOKED"
  | "ACTIVATED" | "DEACTIVATED" | "METADATA_UPDATED";

export type SiteAuditEntry = {
  id: string;
  siteId: string;
  action: SiteAuditAction;
  byStaffId: string;
  byStaffName: string;
  detail: string | null;
  at: string;
};

export type RegisterSiteInput = {
  tenantId: string;
  subdomain?: string;
  customDomain?: string;
  hostingProvider?: HostingProvider;
  siteType?: SiteType;
  submittedUrl?: string;
};

export type UpdateSiteInput = Partial<{
  subdomain: string;
  customDomain: string;
  hostingProvider: HostingProvider;
  siteType: SiteType;
  submittedUrl: string;
}>;

const BASE = "/admin/platform/sites";

export const sitesApi = {
  list: () => api.get<TenantSiteSummary[]>(BASE),
  get: (id: string) => api.get<TenantSiteDetail>(`${BASE}/${id}`),
  audit: (id: string) => api.get<SiteAuditEntry[]>(`${BASE}/${id}/audit`),
  register: (body: RegisterSiteInput) => api.post<SiteWithKey>(BASE, body),
  update: (id: string, body: UpdateSiteInput) => api.patch<TenantSiteDetail>(`${BASE}/${id}`, body),
  rotateKey: (id: string) => api.post<SiteWithKey>(`${BASE}/${id}/rotate-key`),
  qaApprove: (id: string, note?: string) =>
    api.post<TenantSiteDetail>(`${BASE}/${id}/qa-approve`, note ? { note } : undefined),
  qaRevoke: (id: string) => api.post<TenantSiteDetail>(`${BASE}/${id}/qa-revoke`),
  activate: (id: string) => api.post<TenantSiteDetail>(`${BASE}/${id}/activate`),
  deactivate: (id: string) => api.post<TenantSiteDetail>(`${BASE}/${id}/deactivate`),
};

/** Derived status for the list-page chip + filters. Order of checks matters:
 *  inactive trumps everything (a deactivated site doesn't serve traffic), then
 *  approved-and-active = live, then submitted-but-not-approved = pending QA. */
export type DerivedStatus = "live" | "pending_qa" | "draft" | "inactive";

export function deriveStatus(site: Pick<TenantSiteSummary, "isActive" | "qaApproved">): DerivedStatus {
  if (!site.isActive) return "inactive";
  if (site.qaApproved) return "live";
  return "pending_qa";
}
