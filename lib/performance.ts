// Performance — /api/jobs/performance/* (self + per-staff for leads/admins).
import { api } from "./api";
import type { Performance } from "@/types";

export const performanceApi = {
  me: () => api.get<Performance>("/performance/me"),
  forStaff: (staffId: string) => api.get<Performance>(`/performance/${staffId}`),
};
