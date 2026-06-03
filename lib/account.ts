// Studio staff auth — /api/jobs/auth/*.
import { api } from "./api";
import { setTokens, clearTokens, getRefreshToken } from "./auth";
import type { AuthResult, Staff } from "@/types";

export async function login(email: string, password: string): Promise<Staff> {
  const { data } = await api.post<AuthResult>("/auth/login", { email, password });
  setTokens(data.accessToken, data.refreshToken);
  return data.staff;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) await api.post("/auth/logout", { refreshToken });
  } catch {
    /* best-effort */
  }
  clearTokens();
}

/** Current staff profile, as a Result for useApiQuery. */
export const meQuery = () => api.get<Staff>("/auth/me");
