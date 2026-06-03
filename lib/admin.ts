// Admin / Team Lead — /api/jobs/admin/*. Lists, staff CRUD, job interventions.
import { api } from "./api";
import type { JobCard, JobDetail, Role, Staff } from "@/types";

export type AdminDashboard = {
  jobs: JobCard[];
  byStatus: Record<string, number>;
  bySla: Record<string, number>;
};

export const adminApi = {
  dashboard: () => api.get<AdminDashboard>("/admin/dashboard"),

  listStaff: () => api.get<Staff[]>("/admin/staff"),
  createStaff: (body: { email: string; fullName: string; role: Role; skills: string[]; password: string }) =>
    api.post<Staff>("/admin/staff", body),
  updateStaff: (id: string, body: { role?: Role; active?: boolean }) =>
    api.patch<Staff>(`/admin/staff/${id}`, body),

  createJob: (body: { jobTypeId: string; tenantId?: string; title: string; brief?: Record<string, unknown> }) =>
    api.post<JobDetail>("/admin/jobs", body),

  reassign: (id: string, staffId: string) => api.patch<JobDetail>(`/admin/${id}/reassign`, { staffId }),
  extendSla: (id: string, hours: number, reason?: string) => api.patch<JobDetail>(`/admin/${id}/extend-sla`, { hours, reason }),
  escalate: (id: string, reason?: string) => api.patch<JobDetail>(`/admin/${id}/escalate`, reason ? { reason } : undefined),
};
