// Jobs — /api/jobs/* (staff queue + lifecycle).
import { api } from "./api";
import type { JobCard, JobDetail } from "@/types";

export const jobsApi = {
  myJobs: () => api.get<JobCard[]>("/my-jobs"),
  available: () => api.get<JobCard[]>("/available"),
  get: (id: string) => api.get<JobDetail>(`/${id}`),
  claim: (id: string) => api.post<JobDetail>(`/${id}/claim`),
  start: (id: string) => api.patch<JobDetail>(`/${id}/start`),
  submit: (id: string, body: { studioUrl?: string; notes?: string }) =>
    api.post<JobDetail>(`/${id}/submit`, body),
};
