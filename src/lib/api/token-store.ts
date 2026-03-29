"use client";

/**
 * Token storage abstraction.
 *
 * Currently uses localStorage (same as session.ts).
 * When the backend starts sending httpOnly cookies via Set-Cookie,
 * this module can be updated to:
 *  1. Stop reading/writing tokens from localStorage
 *  2. Let the browser send credentials automatically via `fetch({ credentials: "include" })`
 *  3. Only keep non-sensitive session metadata in localStorage (userId, displayName, etc.)
 *
 * This abstraction isolates token access so the migration happens in ONE file,
 * not scattered across session.ts, http.ts, and auth.ts.
 */

const ACCESS_TOKEN_KEY = "academia-auth-token";
const REFRESH_TOKEN_KEY = "academia-auth-refresh-token";
const TOKEN_TYPE_KEY = "academia-auth-token-type";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Whether the backend sends httpOnly cookies and the frontend
 * should rely on `credentials: "include"` instead of Authorization header.
 *
 * Toggle this to `true` when the backend is ready.
 */
export const USE_HTTP_ONLY_COOKIES = false;

// ─── Read ─────────────────────────────────────────────────────────────────

export function getAccessToken(): string | undefined {
  if (USE_HTTP_ONLY_COOKIES) return undefined; // browser sends cookie automatically
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined;
}

export function getRefreshToken(): string | undefined {
  if (USE_HTTP_ONLY_COOKIES) return undefined;
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined;
}

export function getTokenType(): string | undefined {
  if (USE_HTTP_ONLY_COOKIES) return "Bearer";
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(TOKEN_TYPE_KEY) ?? undefined;
}

// ─── Write ────────────────────────────────────────────────────────────────

export function saveTokens(input: {
  token: string;
  refreshToken: string;
  type?: string;
}): void {
  if (USE_HTTP_ONLY_COOKIES) return; // backend manages tokens via Set-Cookie
  if (!isBrowser()) return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, input.token);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, input.refreshToken);
  if (input.type) window.localStorage.setItem(TOKEN_TYPE_KEY, input.type);
}

export function clearTokens(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_TYPE_KEY);
}

// ─── Fetch credentials mode ───────────────────────────────────────────────

/**
 * Returns the `credentials` option for fetch().
 * When using httpOnly cookies: "include" (sends cookies cross-origin).
 * When using localStorage tokens: "same-origin" (default, no cookie needed).
 */
export function getFetchCredentials(): RequestCredentials {
  return USE_HTTP_ONLY_COOKIES ? "include" : "same-origin";
}

/**
 * Returns true if the frontend should inject Authorization header manually.
 * When using httpOnly cookies, the browser handles auth via cookies.
 */
export function shouldInjectAuthHeader(): boolean {
  return !USE_HTTP_ONLY_COOKIES;
}

/**
 * Returns true if tokens are available (either in localStorage or via cookies).
 */
export function hasActiveSession(): boolean {
  if (USE_HTTP_ONLY_COOKIES) {
    // When using httpOnly cookies, we can't check directly.
    // Rely on session metadata presence instead.
    if (!isBrowser()) return false;
    return Boolean(window.localStorage.getItem("academia-auth-user-id"));
  }
  return Boolean(getAccessToken());
}
