import { expect, test } from "@playwright/test";
import {
  clearAuthSession,
  clearImpersonationSession,
  getAccessToken,
  getAuthSessionSnapshot,
  getImpersonationSession,
  isImpersonating,
  restoreOriginalSessionFromImpersonation,
  startImpersonationSession,
} from "../../src/lib/api/session";
import { installMockBrowser, seedTestSession } from "./support/test-runtime";

let browser: ReturnType<typeof installMockBrowser> | undefined;

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
    seedTestSession({
      token: "token-admin",
      refreshToken: "refresh-admin",
      displayName: "Root Admin",
      userId: "user-root",
      activeTenantId: "tenant-centro",
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

    // NOTE: Em produção cookies HttpOnly impedem getAccessToken de retornar
    // o token do frontend; em tests com seedTestSession os cookies não são
    // HttpOnly, então o getter continua resolvendo o valor semeado.
    expect(getAccessToken()).toBe("token-admin");
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
    seedTestSession({
      token: "token-admin",
      refreshToken: "refresh-admin",
      displayName: "Root Admin",
      userId: "user-root",
      activeTenantId: "tenant-centro",
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
