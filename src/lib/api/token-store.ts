"use client";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readStorageToken(key: string): string | undefined {
  if (!isBrowser()) return undefined;
  const storage = globalThis.window?.localStorage;
  const value = storage?.getItem(key)?.trim();
  return value || undefined;
}

function readSessionActiveFlag(): boolean {
  if (!isBrowser()) return false;
  const storage = globalThis.window?.localStorage;
  return storage?.getItem("academia-auth-session-active") === "true";
}

let tokenTypeMemory: string | undefined;

function normalizeToken(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

export function getAccessToken(): string | undefined {
  if (isBrowser() && !readSessionActiveFlag()) {
    return undefined;
  }
  return readStorageToken("academia-auth-token");
}

export function getRefreshToken(): string | undefined {
  if (isBrowser() && !readSessionActiveFlag()) {
    return undefined;
  }
  return readStorageToken("academia-auth-refresh-token");
}

export function getTokenType(): string | undefined {
  if (isBrowser() && !readSessionActiveFlag()) {
    return undefined;
  }
  return tokenTypeMemory ?? readStorageToken("academia-auth-token-type") ?? "Bearer";
}

export function saveTokens(input: {
  token?: string;
  refreshToken?: string;
  type?: string;
}): void {
  tokenTypeMemory = normalizeToken(input.type) ?? "Bearer";
}

export function clearTokens(): void {
  tokenTypeMemory = undefined;
}

export function getFetchCredentials(): RequestCredentials {
  return "include";
}

export function shouldInjectAuthHeader(): boolean {
  return false;
}

export function hasActiveSession(): boolean {
  if (isBrowser()) {
    return readSessionActiveFlag();
  }
  return false;
}
