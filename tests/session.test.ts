import { afterEach, beforeEach, describe, expect, it } from "vitest";
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

describe("session storage", () => {
  beforeEach(() => {
    clearAuthSession();
  });

  afterEach(() => {
    clearAuthSession();
  });

  it("não expõe o access token no browser quando a sessão é persistida por cookie HttpOnly", () => {
    saveAuthSession(makeSession());
    expect(getAccessToken()).toBeUndefined();
    expect(document.cookie).toContain("academia-active-tenant-id=tenant-1");
  });

  it("saves and retrieves display name", () => {
    saveAuthSession(makeSession({ displayName: "João Silva" }));
    expect(getDisplayNameFromSession()).toBe("João Silva");
  });

  it("saves and retrieves active tenant id", () => {
    saveAuthSession(makeSession({ activeTenantId: "tenant-42" }));
    expect(getActiveTenantIdFromSession()).toBe("tenant-42");
  });

  it("saves and retrieves available tenants", () => {
    saveAuthSession(
      makeSession({
        availableTenants: [
          { tenantId: "t1", defaultTenant: true },
          { tenantId: "t2", defaultTenant: false },
        ],
      })
    );
    const tenants = getAvailableTenantsFromSession();
    expect(tenants).toHaveLength(2);
    expect(tenants[0].tenantId).toBe("t1");
  });

  it("saves and retrieves forced password change flag", () => {
    saveAuthSession(makeSession({ forcePasswordChangeRequired: true }));
    expect(getForcePasswordChangeRequiredFromSession()).toBe(true);
  });

  it("clears session completely", () => {
    saveAuthSession(makeSession());
    clearAuthSession();
    expect(getAccessToken()).toBeUndefined();
    expect(getDisplayNameFromSession()).toBeUndefined();
    expect(getActiveTenantIdFromSession()).toBeUndefined();
    expect(getForcePasswordChangeRequiredFromSession()).toBe(false);
    expect(document.cookie).not.toContain("academia-active-tenant-id=");
  });

  it("returns undefined when no session exists", () => {
    expect(getAccessToken()).toBeUndefined();
    expect(getDisplayNameFromSession()).toBeUndefined();
  });

  it("ignora token em memória quando a flag de sessão ativa foi removida", () => {
    saveAuthSession(makeSession());
    window.localStorage.removeItem("academia-auth-session-active");

    expect(hasActiveSession()).toBe(false);
    expect(getAccessToken()).toBeUndefined();
  });

  it("não considera restaurável o retorno para o backoffice quando a sessão veio do store cookie-first", () => {
    saveAuthSession(
      makeSession({
        token: "token-backoffice",
        refreshToken: "refresh-backoffice",
        broadAccess: true,
        availableScopes: ["GLOBAL"],
      })
    );
    rememberBackofficeReturnSession();

    expect(hasRestorableBackofficeReturnSession()).toBe(false);
    const restored = restoreBackofficeReturnSession();

    expect(restored).toBeNull();
    expect(getBackofficeRecoverySession()).toBeNull();
  });

  it("considera restaurável o retorno para o backoffice quando o snapshot explícito contém refresh token", () => {
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
