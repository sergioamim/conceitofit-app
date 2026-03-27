import { expect, test } from "@playwright/test";
import {
  clearAuthSession,
  clearImpersonationSession,
  getAccessToken,
  getAuthSessionSnapshot,
  getImpersonationSession,
  isImpersonating,
  restoreOriginalSessionFromImpersonation,
  saveAuthSession,
  startImpersonationSession,
} from "../../src/lib/api/session";

class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

type MockBrowser = {
  restore(): void;
};

function installMockBrowser(): MockBrowser {
  const globalRef = globalThis as typeof globalThis & {
    window?: Window & typeof globalThis;
  };
  const previousWindow = globalRef.window;
  globalRef.window = {
    localStorage: new MemoryStorage(),
    sessionStorage: new MemoryStorage(),
    dispatchEvent: () => true,
  } as unknown as Window & typeof globalThis;

  return {
    restore() {
      if (previousWindow === undefined) {
        Reflect.deleteProperty(globalRef, "window");
        return;
      }
      globalRef.window = previousWindow;
    },
  };
}

let browser: MockBrowser | undefined;

test.beforeEach(() => {
  browser = installMockBrowser();
  clearAuthSession();
  clearImpersonationSession();
});

test.afterEach(() => {
  clearImpersonationSession();
  clearAuthSession();
  browser?.restore();
});

test.describe("session impersonation helpers", () => {
  test("captura a sessão atual e alterna temporariamente para a sessão impersonada", () => {
    saveAuthSession({
      token: "token-admin",
      refreshToken: "refresh-admin",
      displayName: "Root Admin",
      userId: "user-root",
      activeTenantId: "tenant-centro",
      availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
      availableScopes: ["GLOBAL"],
      broadAccess: true,
    });

    const originalSession = getAuthSessionSnapshot();
    expect(originalSession?.token).toBe("token-admin");

    startImpersonationSession({
      originalSession: originalSession!,
      impersonatedSession: {
        token: "token-bruno",
        refreshToken: "refresh-bruno",
        displayName: "Bruno Suporte",
        userId: "user-bruno",
        activeTenantId: "tenant-centro",
        availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
        availableScopes: ["UNIDADE"],
        broadAccess: false,
      },
      targetUserId: "user-bruno",
      targetUserName: "Bruno Suporte",
      actorDisplayName: "Root Admin",
      justification: "Suporte em produção",
      auditContextId: "audit-imp-1",
      returnPath: "/admin/seguranca/usuarios/user-bruno",
    });

    expect(getAccessToken()).toBe("token-bruno");
    expect(isImpersonating()).toBeTruthy();
    expect(getImpersonationSession()).toMatchObject({
      targetUserId: "user-bruno",
      targetUserName: "Bruno Suporte",
      actorDisplayName: "Root Admin",
      auditContextId: "audit-imp-1",
      returnPath: "/admin/seguranca/usuarios/user-bruno",
    });
  });

  test("restaura a sessão original e limpa o snapshot de impersonação", () => {
    saveAuthSession({
      token: "token-admin",
      refreshToken: "refresh-admin",
      displayName: "Root Admin",
      userId: "user-root",
      activeTenantId: "tenant-centro",
      availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
    });

    const originalSession = getAuthSessionSnapshot();

    startImpersonationSession({
      originalSession: originalSession!,
      impersonatedSession: {
        token: "token-bruno",
        refreshToken: "refresh-bruno",
        displayName: "Bruno Suporte",
        userId: "user-bruno",
        activeTenantId: "tenant-centro",
        availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
      },
      targetUserId: "user-bruno",
      targetUserName: "Bruno Suporte",
      justification: "Suporte em produção",
    });

    const restored = restoreOriginalSessionFromImpersonation();
    expect(restored?.targetUserId).toBe("user-bruno");
    expect(getAccessToken()).toBe("token-admin");

    clearImpersonationSession();
    expect(isImpersonating()).toBeFalsy();
    expect(getImpersonationSession()).toBeNull();
  });
});
