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

// Hard ceiling on a single request. Long enough to ride out Render's
// free-tier cold start, short enough to surface as a real error instead
// of an infinite spinner.
const REQUEST_TIMEOUT_MS = 45_000;
const UPLOAD_TIMEOUT_MS = 120_000;

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

  // The PUBLIC auth endpoints (login/refresh/logout) are pre-auth — they
  // shouldn't carry a Bearer token. Spring's oauth2ResourceServer validates
  // any token it sees BEFORE the permitAll check, so a stale/expired token
  // poisons even those public calls with "Authentication is required to
  // access this resource". (Same shape as the conddo-app fix 1561704.)
  //
  // /auth/me is the lone authenticated endpoint under /auth/* — it's how
  // the UI asks "who am I?", so it MUST carry the token. Don't strip there.
  const isPublicAuthCall = path === "/auth/login" || path === "/auth/refresh" || path === "/auth/logout";
  const token = isPublicAuthCall ? null : getAccessToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    throw new StudioApiError(
      aborted ? "request_timeout" : "network_error",
      aborted ? "The server didn't respond in time. Please try again." : "Could not reach the Studio server.",
    );
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 && !isPublicAuthCall && !retried && token) {
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

/** Multipart file upload — used by asset uploads. Lets the browser set the
 *  multipart boundary (no Content-Type header from us). Same Bearer token +
 *  401-refresh behaviour as request(). */
export async function uploadFile<T>(path: string, form: FormData, retried = false): Promise<Result<T>> {
  if (!ROOT) throw new StudioApiError("api_not_configured", "Studio API URL is not configured.");

  const token = getAccessToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    throw new StudioApiError(
      aborted ? "request_timeout" : "network_error",
      aborted ? "Upload timed out. Please try again." : "Could not reach the Studio server.",
    );
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 && !retried && token) {
    const next = await refreshAccessToken();
    if (next) return uploadFile<T>(path, form, true);
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new StudioApiError("unauthorized", "Your session has expired. Please sign in again.", 401);
  }

  let json: ApiResponse<T> | null = null;
  try { json = (await res.json()) as ApiResponse<T>; } catch { /* non-JSON */ }

  if (!res.ok || (json && json.success === false)) {
    throw new StudioApiError(
      json?.error?.code ?? "request_failed",
      json?.error?.message ?? res.statusText ?? "Upload failed.",
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
  upload: <T>(path: string, form: FormData) => uploadFile<T>(path, form),
};
