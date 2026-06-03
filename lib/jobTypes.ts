// Job types — /api/jobs/admin/job-types/*.
// Read: TEAM_LEAD + ADMIN. Mutate: ADMIN only (backend enforces; FE gates the UI).
//
// The id is UPPER_SNAKE_CASE (3-32 chars) and immutable after creation. Soft-delete
// via DELETE flips `active` to false because every studio.jobs row holds an FK to
// job_types(id) — hard delete would orphan history.
import { api } from "./api";
import type { JobType, QaChecklistItem } from "@/types";

export type CreateJobTypeInput = {
  id: string;
  displayName: string;
  colour?: string;
  assignedToRoles: string[];
  slaHours: number;
  qaRequired?: boolean;
  qaChecklist?: QaChecklistItem[];
};

export type UpdateJobTypeInput = Partial<{
  displayName: string;
  colour: string;
  assignedToRoles: string[];
  slaHours: number;
  qaRequired: boolean;
  qaChecklist: QaChecklistItem[];
  active: boolean;
}>;

export const jobTypesApi = {
  list: () => api.get<JobType[]>("/admin/job-types"),
  create: (body: CreateJobTypeInput) => api.post<JobType>("/admin/job-types", body),
  update: (id: string, body: UpdateJobTypeInput) =>
    api.patch<JobType>(`/admin/job-types/${id}`, body),
  /** Soft-delete — flips active to false. To reactivate, PATCH active:true. */
  remove: (id: string) => api.del<void>(`/admin/job-types/${id}`),
};
