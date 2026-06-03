// Typed fetch client for the Conddo Studio backend (io.conddo.studio). All
// endpoints live under /api/jobs. Handles the {success,data,error} envelope,
// the Bearer access token, and silent refresh-on-401 (body-based refresh token).

import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./auth";

const ROOT = process.env.NEXT_PUBLIC_STUDIO_API_URL ?? "";
const BASE = `${ROOT}/api/jobs`;

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  meta?: { page?: number; size?: number; total?: number };
  error?: { code: string; message: string; details?: unknown };
};
export type Result<T> = { data: T; meta?: ApiResponse<T>["meta"] };

export class StudioApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 0) {
    super(message);
    this.name = "StudioApiError";
    this.code = code;
    this.status = status;
  }
}

export const isNotConfigured = (e: unknown): boolean =>
  e instanceof StudioApiError && e.code === "api_not_configured";
export const isServerError = (e: unknown): boolean =>
  e instanceof StudioApiError && e.status >= 500;

type Body = Record<string, unknown> | undefined;

// One in-flight refresh shared across concurrent 401s.
let refreshing: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = (async () => {
      const rt = getRefreshToken();
      if (!rt) return null;
      try {
        const res = await fetch(`${BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
        });
        if (!res.ok) {
          clearTokens();
          return null;
        }
        const json = (await res.json()) as ApiResponse<{ accessToken: string; refreshToken: string }>;
        if (json?.data?.accessToken) {
          setTokens(json.data.accessToken, json.data.refreshToken ?? rt);
          return json.data.accessToken;
        }
        clearTokens();
        return null;
      } catch {
        clearTokens();
        return null;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

async function request<T>(method: string, path: string, body?: Body, retried = false): Promise<Result<T>> {
  if (!ROOT) throw new StudioApiError("api_not_configured", "Studio API URL is not configured.");

  const token = getAccessToken();
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new StudioApiError("network_error", "Could not reach the Studio server.");
  }

  // Don't auto-refresh auth calls themselves.
  const isAuthCall = path.startsWith("/auth/");
  if (res.status === 401 && !isAuthCall && !retried && token) {
    const next = await refreshAccessToken();
    if (next) return request<T>(method, path, body, true);
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new StudioApiError("unauthorized", "Your session has expired. Please sign in again.", 401);
  }

  let json: ApiResponse<T> | null = null;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    /* non-JSON (e.g. 204) */
  }

  if (!res.ok || (json && json.success === false)) {
    throw new StudioApiError(
      json?.error?.code ?? "request_failed",
      json?.error?.message ?? res.statusText ?? "Request failed.",
      res.status,
    );
  }
  return { data: (json ? json.data : undefined) as T, meta: json?.meta };
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: Body) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: Body) => request<T>("PATCH", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};
