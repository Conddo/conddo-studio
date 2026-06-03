// Design Standards Library — /api/jobs/admin/design-standards/*.
// Read: TEAM_LEAD + ADMIN. Mutate: ADMIN only (backend enforces; FE gates UI).
//
// These are admin-curated references that AI prompt-injection reads at
// generation time (next backend sub-slice — see BACKEND_STATUS.md §2). For
// V1, the page is pure CRUD; the AI integration lands without FE changes.
import { api } from "./api";
import type { DesignStandard, DesignStandardKind } from "@/types";

export type CreateDesignStandardInput = {
  vertical?: string | null;
  kind: DesignStandardKind;
  name: string;
  description?: string | null;
  content?: Record<string, unknown>;
};

export type UpdateDesignStandardInput = Partial<{
  vertical: string | null;
  name: string;
  description: string | null;
  content: Record<string, unknown>;
  active: boolean;
  // Note: `kind` is intentionally immutable — keeps the AI prompt-injection
  // contract stable. To "rename" the kind, delete + create.
}>;

export const designStandardsApi = {
  list: (kind?: DesignStandardKind) =>
    api.get<DesignStandard[]>(`/admin/design-standards${kind ? `?kind=${kind}` : ""}`),
  get: (id: string) => api.get<DesignStandard>(`/admin/design-standards/${id}`),
  create: (body: CreateDesignStandardInput) =>
    api.post<DesignStandard>("/admin/design-standards", body),
  update: (id: string, body: UpdateDesignStandardInput) =>
    api.patch<DesignStandard>(`/admin/design-standards/${id}`, body),
  /** Soft-delete — flips active to false. To reactivate, PATCH active:true. */
  remove: (id: string) => api.del<void>(`/admin/design-standards/${id}`),
};
