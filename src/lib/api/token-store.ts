"use client";

/**
 * Token Store — Lê tokens de cookies HttpOnly definidos pelo backend.
 *
 * O backend (academia-java / AuthTokenResolver) já define:
 *   - fc_access_token (HttpOnly, Secure, SameSite=Lax)
 *   - fc_refresh_token (HttpOnly, Secure, SameSite=Lax, path=/auth/refresh)
 *
 * O frontend NAO grava tokens — apenas os lê via document.cookie.
 * A escrita é exclusiva do backend (Set-Cookie header).
 *
 * Task 458: Migração de localStorage → HttpOnly cookies
 */

const ACCESS_TOKEN_COOKIE = "fc_access_token";
const REFRESH_TOKEN_COOKIE = "fc_refresh_token";
const SESSION_CLAIMS_COOKIE = "fc_session_claims";
const SESSION_ACTIVE_FLAG_COOKIE = "fc_session_active";

function isBrowser(): boolean {
  // Em ambientes de teste `window` pode existir sem `document` — precisamos
  // validar ambos porque os call-sites leem `document.cookie` após o guard.
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * Lê um cookie específico por nome. Retorna undefined se não encontrado.
 */
function readCookie(name: string): string | undefined {
  if (!isBrowser()) return undefined;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`),
  );
  if (!match) return undefined;
  const value = decodeURIComponent(match[1]);
  return value || undefined;
}

/**
 * Lê claims de sessão do cookie não-httpOnly.
 * O backend deve definir este cookie com claims seguros (sem tokens).
 */
interface SessionClaims {
  userId?: string;
  userKind?: string;
  displayName?: string;
  networkId?: string;
  networkSubdomain?: string;
  networkSlug?: string;
  networkName?: string;
  activeTenantId?: string;
  baseTenantId?: string;
  availableScopes?: string[];
  broadAccess?: boolean;
  forcePasswordChangeRequired?: boolean;
  sessionMode?: string;
  contextOrigin?: string;
  sandboxMode?: boolean;
  sandboxRedeId?: string;
  sandboxUnidadeId?: string;
  sandboxExpiresAt?: string;
}

function readSessionClaims(): SessionClaims | null {
  const raw = readCookie(SESSION_CLAIMS_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionClaims;
  } catch {
    return null;
  }
}

/**
 * Verifica se há sessão ativa via cookie de flag.
 * Fallback: se o cookie de flag não existe, tenta ler o access token cookie.
 */
function hasSessionCookie(): boolean {
  const flag = readCookie(SESSION_ACTIVE_FLAG_COOKIE);
  if (flag === "true") return true;
  // Fallback: se o cookie de access token existe, há sessão
  const token = readCookie(ACCESS_TOKEN_COOKIE);
  return Boolean(token);
}

let tokenTypeMemory: string | undefined;

function normalizeToken(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

export function getAccessToken(): string | undefined {
  if (isBrowser() && !hasSessionCookie()) {
    return undefined;
  }
  return readCookie(ACCESS_TOKEN_COOKIE);
}

export function getRefreshToken(): string | undefined {
  if (isBrowser() && !hasSessionCookie()) {
    return undefined;
  }
  return readCookie(REFRESH_TOKEN_COOKIE);
}

export function getTokenType(): string | undefined {
  if (isBrowser() && !hasSessionCookie()) {
    return undefined;
  }
  return tokenTypeMemory ?? "Bearer";
}

/**
 * NO-OP: tokens são escritos exclusivamente pelo backend via Set-Cookie.
 * O frontend não deve gravar tokens em lugar nenhum.
 */
export function saveTokens(_input: {
  token?: string;
  refreshToken?: string;
  type?: string;
}): void {
  tokenTypeMemory = normalizeToken(_input.type) ?? "Bearer";
}

/**
 * NO-OP: tokens são limpos pelo backend no logout (cookies expirados).
 * Apenas limpamos memória volátil.
 */
export function clearTokens(): void {
  tokenTypeMemory = undefined;
}

/**
 * Lê claims de sessão de forma tipada.
 * Usado como substituto para getUserIdFromSession, getUserKindFromSession, etc.
 */
export function getSessionClaims(): SessionClaims | null {
  return readSessionClaims();
}

export function getFetchCredentials(): RequestCredentials {
  return "include";
}

export function shouldInjectAuthHeader(): boolean {
  return false;
}

export function hasActiveSession(): boolean {
  if (isBrowser()) {
    return hasSessionCookie();
  }
  return false;
}
