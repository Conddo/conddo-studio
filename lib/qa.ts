// QA queue + review — /api/jobs/qa/*. Reviewer / Team Lead / Admin only.
import { api } from "./api";
import type { JobCard, JobDetail } from "@/types";

export type ChecklistItemResult = { passed: boolean; note?: string | null };
export type ChecklistResult = Record<string, ChecklistItemResult>;

export const qaApi = {
  queue: () => api.get<JobCard[]>("/qa/queue"),
  start: (id: string) => api.post<JobDetail>(`/qa/${id}/start`),
  approve: (id: string, body: { checklist?: ChecklistResult; positiveNotes?: string }) =>
    api.post<JobDetail>(`/qa/${id}/approve`, body),
  returnForRevision: (id: string, body: { checklist?: ChecklistResult; feedback: string }) =>
    api.post<JobDetail>(`/qa/${id}/return`, body),
  // AI QA scan — returns { available: false } when Claude is off.
  scan: (id: string) => api.get<{ available: boolean; issues?: unknown[]; suggestions?: unknown[]; positives?: string[]; overallQuality?: string }>(`/qa/${id}/scan`),
};
