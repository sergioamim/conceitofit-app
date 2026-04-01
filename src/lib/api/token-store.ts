"use client";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readSessionActiveFlag(): boolean {
  if (!isBrowser()) return false;
  const storage = globalThis.window?.localStorage;
  return storage?.getItem("academia-auth-session-active") === "true";
}

let accessTokenMemory: string | undefined;
let refreshTokenMemory: string | undefined;
let tokenTypeMemory: string | undefined;

function normalizeToken(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

export function getAccessToken(): string | undefined {
  return accessTokenMemory;
}

export function getRefreshToken(): string | undefined {
  return refreshTokenMemory;
}

export function getTokenType(): string | undefined {
  return tokenTypeMemory ?? "Bearer";
}

export function saveTokens(input: {
  token?: string;
  refreshToken?: string;
  type?: string;
}): void {
  accessTokenMemory = normalizeToken(input.token);
  refreshTokenMemory = normalizeToken(input.refreshToken);
  tokenTypeMemory = normalizeToken(input.type) ?? "Bearer";
}

export function clearTokens(): void {
  accessTokenMemory = undefined;
  refreshTokenMemory = undefined;
  tokenTypeMemory = undefined;
}

export function getFetchCredentials(): RequestCredentials {
  return "include";
}

export function shouldInjectAuthHeader(): boolean {
  return Boolean(getAccessToken());
}

export function hasActiveSession(): boolean {
  if (accessTokenMemory || refreshTokenMemory) {
    return true;
  }
  return readSessionActiveFlag();
}
