// Studio staff token store. The access token is short-lived; the refresh token
// is returned in the login/refresh body (NOT a cookie, unlike the main platform)
// and exchanged at /api/jobs/auth/refresh. Kept in localStorage.

const ACCESS = "conddo_studio_access";
const REFRESH = "conddo_studio_refresh";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS, accessToken);
  window.localStorage.setItem(REFRESH, refreshToken);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS);
  window.localStorage.removeItem(REFRESH);
}
