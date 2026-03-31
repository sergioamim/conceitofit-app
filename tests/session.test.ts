import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearAuthSession,
  getAccessToken,
  getActiveTenantIdFromSession,
  getAvailableTenantsFromSession,
  getDisplayNameFromSession,
  getForcePasswordChangeRequiredFromSession,
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

  it("saves and retrieves access token", () => {
    saveAuthSession(makeSession());
    expect(getAccessToken()).toBe("test-token");
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
  });

  it("returns undefined when no session exists", () => {
    expect(getAccessToken()).toBeUndefined();
    expect(getDisplayNameFromSession()).toBeUndefined();
  });
});
