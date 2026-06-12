// Studio-side typed API surface for cross-tenant feature flag review.
//
// Conddo tenants on conddo-app click "Request Beta access" on /features →
// BE records the request as a tenant_feature_flags row with interest=true,
// enabled=false. Conddo ops uses this page on Studio to see those requests
// across every tenant and grant or revoke access.
//
// Underlying source of truth is the shared Postgres' tenant_feature_flags
// table (owned by conddo-backend). Studio backend reads + writes via its
// existing JPA connection (same pattern Platform Tenants / Sites use).

import { api } from "./api";

/** Status of a tenant_feature_flag row. The FE filters by these:
 *  - `interest`: tenant asked for it, ops hasn't reviewed yet
 *  - `granted`: ops gave access (enabled = true)
 *  - `revoked`: ops gave then took away (enabled = false but granted_at set)
 *  Server-derived from (interest, enabled, granted_at) so the FE doesn't
 *  have to re-derive. */
export type FlagRequestStatus = "interest" | "granted" | "revoked";

export type FeatureFlagRequest = {
  /** Composite key. The grant/revoke endpoints are keyed by both. */
  tenantId: string;
  featureKey: string;

  /** Tenant context — server-joined for the table cells. */
  tenantName: string;
  tenantSlug: string;
  tenantVertical: string | null;

  /** Plan tier — useful when prioritising grants ("Growth tenants first"). */
  tenantPlan?: string | null;

  status: FlagRequestStatus;
  /** When the tenant first registered interest. */
  interestAt: string | null;
  /** When ops granted (if ever). */
  grantedAt: string | null;
  /** Who granted (staff name, server-joined). */
  grantedByName: string | null;
};

export type ListParams = {
  /** Filter — defaults to "interest" (the review queue). */
  status?: FlagRequestStatus | "all";
  /** Filter by a specific feature_key. */
  featureKey?: string;
};

const BASE = "/admin/platform/feature-flags";

export const featureFlagsApi = {
  /** Cross-tenant review queue. Sorted server-side by interest_at DESC so
   *  the oldest pending request rises to the top. */
  list: (params: ListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.featureKey) qs.set("featureKey", params.featureKey);
    const tail = qs.toString();
    return api.get<FeatureFlagRequest[]>(`${BASE}${tail ? `?${tail}` : ""}`);
  },

  /** Grant access. BE records `granted_by` from the acting Studio JWT. */
  grant: (tenantId: string, featureKey: string) =>
    api.post<FeatureFlagRequest>(`${BASE}/${tenantId}/${featureKey}/grant`),

  /** Revoke previously-granted access. Keeps `interest_at` so the request
   *  shape stays auditable; ops can re-grant later if the tenant follows
   *  up. */
  revoke: (tenantId: string, featureKey: string) =>
    api.post<FeatureFlagRequest>(`${BASE}/${tenantId}/${featureKey}/revoke`),
};

/** Display labels for the feature_key column. Mirrors the pharmacy roadmap
 *  list in conddo-app's lib/api/features.ts → ROADMAP_FEATURES. Kept here
 *  so Studio doesn't depend on conddo-app types. */
export const FEATURE_LABELS: Record<string, string> = {
  cashback_loyalty:   "Cashback Loyalty",
  followup_workflow:  "Follow-up Workflow",
  drug_programs:      "Drug Programs",
  emr_basic:          "Basic EMR",
  offline_mobile:     "Offline Mobile App",
  multi_store:        "Multi-Store Management",
  customer_retainer:  "Customer Retainer",
  barcode_scan:       "Barcode Scanning (Web)",
  emr_full:           "Full EMR with Compliance",
  pos:                "Point of Sale",
};

export function featureLabel(key: string): string {
  return FEATURE_LABELS[key] ?? key.replace(/_/g, " ").replace(/(^| )./g, (m) => m.toUpperCase());
}

export const STATUS_LABELS: Record<FlagRequestStatus, string> = {
  interest: "Awaiting review",
  granted:  "Granted",
  revoked:  "Revoked",
};
