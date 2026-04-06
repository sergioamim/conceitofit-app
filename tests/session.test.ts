import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAuthSession,
  getAccessToken,
  getActiveTenantIdFromSession,
  getAvailableTenantsFromSession,
  getBackofficeRecoverySession,
  getDisplayNameFromSession,
  getForcePasswordChangeRequiredFromSession,
  hasRestorableBackofficeReturnSession,
  hasActiveSession,
  rememberBackofficeReturnSession,
  restoreBackofficeReturnSession,
  saveAuthSession,
  type AuthSession,
} from "@/lib/api/session";

/**
 * Task 458: Testes atualizados para o modelo de cookies HttpOnly.
 *
 * Tokens e claims vêm de cookies definidos pelo backend (Set-Cookie).
 * O frontend apenas lê via document.cookie — não grava tokens localmente.
 */

function makeSession(overrides?: Partial<AuthSession>): AuthSession {
  return {
    token: "test-token",
    refreshToken: "test-refresh",
    userId: "user-1",
    displayName: "Test User",
    activeTenantId: "tenant-1",
    availableTenants: [{ tenantId: "tenant-1", defaultTenant: true }],
    ...overrides,
  };
}

/**
 * Mock do cookie fc_session_claims que substitui localStorage para claims.
 * O backend define este cookie não-httpOnly para leitura client-side.
 */
function mockSessionClaims(claims: Record<string, unknown>): void {
  document.cookie = `fc_session_claims=${encodeURIComponent(JSON.stringify(claims))}; Path=/; SameSite=Lax`;
}

function mockSessionActive(value = "true"): void {
  document.cookie = `fc_session_active=${value}; Path=/; SameSite=Lax`;
}

function clearSessionCookies(): void {
  document.cookie = "fc_session_claims=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "fc_session_active=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "fc_access_token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "fc_refresh_token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "academia-active-tenant-id=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

describe("session storage (cookie-based — Task 458)", () => {
  beforeEach(() => {
    clearAuthSession();
    clearSessionCookies();
  });

  afterEach(() => {
    clearAuthSession();
    clearSessionCookies();
  });

  it("não expõe o access token no browser quando a sessão é persistida por cookie HttpOnly", () => {
    // Com cookies HttpOnly, getAccessToken lê document.cookie mas não encontra fc_access_token
    // pois o browser não expõe cookies HttpOnly via JS.
    // Isso é comportamento CORRETO: o token só vai no request via credentials: 'include'.
    mockSessionActive("true");
    saveAuthSession(makeSession());
    expect(getAccessToken()).toBeUndefined();
  });

  it("lê display name do cookie de claims", () => {
    mockSessionActive("true");
    mockSessionClaims({ displayName: "João Silva" });
    expect(getDisplayNameFromSession()).toBe("João Silva");
  });

  it("lê active tenant id do cookie de claims", () => {
    mockSessionActive("true");
    mockSessionClaims({ activeTenantId: "tenant-42" });
    expect(getActiveTenantIdFromSession()).toBe("tenant-42");
  });

  it("availableTenants retorna array vazio (resolvido pelo backend)", () => {
    mockSessionActive("true");
    mockSessionClaims({});
    const tenants = getAvailableTenantsFromSession();
    expect(tenants).toEqual([]);
  });

  it("lê forced password change flag do cookie de claims", () => {
    mockSessionActive("true");
    mockSessionClaims({ forcePasswordChangeRequired: true });
    expect(getForcePasswordChangeRequiredFromSession()).toBe(true);
  });

  it("clears session completely — tokens via backend, claims permanecem até expirar", () => {
    mockSessionActive("true");
    mockSessionClaims({ displayName: "Test", activeTenantId: "t1" });
    clearAuthSession();
    // Task 458: clearAuthSession expira o cookie de flag de sessão.
    // O cookie fc_session_claims é httpOnly — não podemos expirar via JS.
    // O que importa é que hasActiveSession retorna false e tokens são indefinidos.
    expect(hasActiveSession()).toBe(false);
    expect(getForcePasswordChangeRequiredFromSession()).toBe(false);
  });

  it("returns undefined when no session exists", () => {
    expect(getDisplayNameFromSession()).toBeUndefined();
    expect(getActiveTenantIdFromSession()).toBeUndefined();
  });

  it("hasActiveSession retorna false sem cookie de sessão", () => {
    expect(hasActiveSession()).toBe(false);
  });

  it("hasActiveSession retorna true com cookie de sessão ativo", () => {
    mockSessionActive("true");
    expect(hasActiveSession()).toBe(true);
  });

  it("ignora cookie de claims sem flag de sessão ativa", () => {
    mockSessionClaims({ displayName: "Test" });
    // Sem fc_session_active, não há sessão ativa
    expect(hasActiveSession()).toBe(false);
  });

  it("não considera restaurável o retorno para o backoffice quando a sessão veio do store cookie-first", () => {
    mockSessionActive("true");
    mockSessionClaims({ broadAccess: true, availableScopes: ["GLOBAL"] });
    saveAuthSession(makeSession());
    rememberBackofficeReturnSession();

    expect(hasRestorableBackofficeReturnSession()).toBe(false);
    const restored = restoreBackofficeReturnSession();

    expect(restored).toBeNull();
    expect(getBackofficeRecoverySession()).toBeNull();
  });

  it("considera restaurável o retorno para o backoffice quando o snapshot explícito contém refresh token", () => {
    mockSessionActive("true");
    mockSessionClaims({ broadAccess: true, availableScopes: ["GLOBAL"] });
    rememberBackofficeReturnSession(
      makeSession({
        token: "token-backoffice",
        refreshToken: "refresh-backoffice",
        broadAccess: true,
        availableScopes: ["GLOBAL"],
      })
    );

    expect(hasRestorableBackofficeReturnSession()).toBe(true);

    const restored = restoreBackofficeReturnSession();

    expect(restored?.originalSession.refreshToken).toBe("refresh-backoffice");
    expect(getBackofficeRecoverySession()?.refreshToken).toBe("refresh-backoffice");
  });
});
