import { expect, test } from "@playwright/test";
import {
  adminEntrarComoUnidadeApi,
  adminLoginApi,
  changeForcedPasswordApi,
  getAccessNetworkContextApi,
  loginApi,
  requestPasswordRecoveryApi,
} from "../../src/lib/api/auth";
import { getSessionBootstrapApi } from "../../src/lib/api/contexto-unidades";
import {
  clearAuthSession,
  hasBackofficeReturnSession,
  getAvailableScopesFromSession,
  getBroadAccessFromSession,
  getForcePasswordChangeRequiredFromSession,
  getNetworkSubdomainFromSession,
  getNetworkSlugFromSession,
  restoreBackofficeReturnSession,
  saveAuthSession,
} from "../../src/lib/api/session";
import { installMockBrowser, mockFetchWithSequence } from "./support/test-runtime";

let browser: ReturnType<typeof installMockBrowser> | undefined;

test.beforeEach(() => {
  browser = installMockBrowser();
  clearAuthSession();
  process.env.NEXT_PUBLIC_API_BASE_URL = "";
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
});

test.afterEach(() => {
  clearAuthSession();
  browser?.restore();
});

test.describe("auth por rede", () => {
  test("loginApi envia identifier contextualizado e persiste metadados da rede", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          token: "token-rede",
          refreshToken: "refresh-rede",
          redeId: "rede-1",
          redeSlug: "rede-norte",
          redeNome: "Rede Norte",
          activeTenantId: "tenant-centro",
          tenantBaseId: "tenant-base",
          availableScopes: ["REDE"],
          broadAccess: true,
          availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
        },
      },
    ]);

    try {
      const session = await loginApi({
        identifier: "ana@qa.local",
        password: "12345678",
        redeIdentifier: "rede-norte",
      });

      expect(calls[0]?.url).toContain("/api/v1/auth/login");
      expect(calls[0]?.method).toBe("POST");
      expect(calls[0]?.headers.get("X-Rede-Identifier")).toBe("rede-norte");
      expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
        identifier: "ana@qa.local",
        password: "12345678",
        channel: "APP",
      });
      expect(session.networkSubdomain).toBe("rede-norte");
      expect(session.networkSlug).toBe("rede-norte");
      expect(session.baseTenantId).toBe("tenant-base");
      expect(getNetworkSubdomainFromSession()).toBe("rede-norte");
      expect(getNetworkSlugFromSession()).toBe("rede-norte");
      expect(getAvailableScopesFromSession()).toEqual(["REDE"]);
      expect(getBroadAccessFromSession()).toBeTruthy();
    } finally {
      restore();
    }
  });

  test("loginApi persiste o flag de troca obrigatória de senha quando o backend exigir primeiro acesso", async () => {
    const { restore } = mockFetchWithSequence([
      {
        body: {
          token: "token-rede",
          refreshToken: "refresh-rede",
          redeSlug: "rede-norte",
          redeNome: "Rede Norte",
          forcePasswordChange: true,
        },
      },
    ]);

    try {
      const session = await loginApi({
        identifier: "ana@qa.local",
        password: "12345678",
        redeIdentifier: "rede-norte",
      });

      expect(session.forcePasswordChangeRequired).toBe(true);
      expect(getForcePasswordChangeRequiredFromSession()).toBe(true);
    } finally {
      restore();
    }
  });

  test("adminLoginApi usa endpoint global e persiste a sessao sem contexto de rede", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          token: "token-admin",
          refreshToken: "refresh-admin",
          userId: "user-admin",
          userKind: "ADMIN",
          displayName: "Admin Master",
          activeTenantId: "tenant-admin",
          tenantBaseId: "tenant-admin-base",
          availableScopes: ["GLOBAL"],
          broadAccess: true,
        },
      },
    ]);

    try {
      const session = await adminLoginApi({
        email: "admin@qa.local",
        password: "12345678",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0]?.url).toContain("/api/v1/admin/auth/login");
      expect(calls[0]?.method).toBe("POST");
      expect(calls[0]?.headers.get("X-Rede-Identifier")).toBeNull();
      expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
        email: "admin@qa.local",
        password: "12345678",
      });
      expect(session.token).toBe("token-admin");
      expect(session.refreshToken).toBe("refresh-admin");
      expect(session.availableScopes).toEqual(["GLOBAL"]);
      expect(session.activeTenantId).toBe("tenant-admin");
    } finally {
      restore();
    }
  });

  test("adminEntrarComoUnidadeApi troca para a unidade via endpoint de contexto", async () => {
    saveAuthSession({
      token: "token-admin",
      refreshToken: "refresh-admin",
      userId: "user-admin",
      userKind: "ADMIN",
      displayName: "Admin Master",
      activeTenantId: "tenant-admin",
      tenantBaseId: "tenant-admin-base",
      availableScopes: ["GLOBAL"],
      broadAccess: true,
    });

    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          token: "token-admin-unidade",
          refreshToken: "refresh-admin-unidade",
          userId: "user-admin",
          userKind: "ADMIN",
          displayName: "Admin Master",
          activeTenantId: "tenant-centro",
          tenantBaseId: "tenant-admin-base",
          availableScopes: ["GLOBAL"],
          broadAccess: true,
        },
      },
    ]);

    try {
      const session = await adminEntrarComoUnidadeApi({
        academiaId: "academia-norte",
        tenantId: "tenant-centro",
        justificativa: "auditoria",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0]?.url).toContain("/api/v1/auth/context/tenant");
      expect(calls[0]?.method).toBe("POST");
      expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
        tenantId: "tenant-centro",
      });
      expect(hasBackofficeReturnSession()).toBeTruthy();
      expect(session.activeTenantId).toBe("tenant-centro");
      expect(session.token).toBe("token-admin-unidade");
      const restored = restoreBackofficeReturnSession();
      expect(restored?.originalSession.token).toBe("token-admin");
    } finally {
      restore();
    }
  });

  test("getSessionBootstrapApi normaliza rede, unidade-base e tenant ativo separados", async () => {
    saveAuthSession({
      token: "token-bootstrap",
      refreshToken: "refresh-bootstrap",
      activeTenantId: "tenant-centro",
      availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
    });

    const { restore } = mockFetchWithSequence([
      {
        body: {
          user: {
            userId: "user-ana",
            nome: "Ana Admin",
            displayName: "Ana Admin",
            email: "ana@qa.local",
            roles: ["ADMIN"],
            userKind: "COLABORADOR",
            redeId: "rede-1",
            redeSlug: "rede-norte",
            redeNome: "Rede Norte",
            activeTenantId: "tenant-centro",
            tenantBaseId: "tenant-base",
            availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
            availableScopes: ["UNIDADE", "REDE"],
            broadAccess: false,
          },
          tenantContext: {
            currentTenantId: "tenant-centro",
            tenantAtual: { id: "tenant-centro", nome: "Unidade Centro", ativo: true },
            unidadesDisponiveis: [
              { id: "tenant-centro", nome: "Unidade Centro", ativo: true },
              { id: "tenant-base", nome: "Unidade Base", ativo: true },
            ],
          },
          academia: { id: "academia-norte", nome: "Rede Norte", ativo: true },
        },
      },
    ]);

    try {
      const response = await getSessionBootstrapApi();

      expect(response.user.userId).toBe("user-ana");
      expect(response.user.networkName).toBe("Rede Norte");
      expect(response.user.networkSubdomain).toBe("rede-norte");
      expect(response.user.baseTenantId).toBe("tenant-base");
      expect(response.user.activeTenantId).toBe("tenant-centro");
      expect(response.user.availableScopes).toEqual(["UNIDADE", "REDE"]);
      expect(response.user.broadAccess).toBeFalsy();
      expect(response.tenantContext.currentTenantId).toBe("tenant-centro");
      expect(response.tenantContext.unidadesDisponiveis).toHaveLength(2);
    } finally {
      restore();
    }
  });

  test("fluxos sem sessão usam X-Rede-Identifier e falham sem fallback silencioso", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          message: "Instruções enviadas para a rede correta.",
        },
      },
      {
        body: {
          error: "Not Found",
          message: "Rede inválida.",
        },
        status: 404,
      },
    ]);

    try {
      await requestPasswordRecoveryApi({
        redeIdentifier: "rede-norte",
        identifier: "ana@qa.local",
      });

      await expect(async () => {
        await getAccessNetworkContextApi("rede-invalida", { allowDefaultFallback: false });
      }).rejects.toThrow("Rede inválida.");

      expect(calls[0]?.url).toContain("/api/v1/auth/forgot-password");
      expect(calls[0]?.headers.get("X-Rede-Identifier")).toBe("rede-norte");
      expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
        identifier: "ana@qa.local",
        channel: "APP",
      });

      expect(calls[1]?.url).toContain("/api/v1/auth/rede-contexto");
      expect(calls[1]?.headers.get("X-Rede-Identifier")).toBe("rede-invalida");
    } finally {
      restore();
    }
  });

  test("changeForcedPasswordApi usa a sessão atual e limpa o flag após sucesso", async () => {
    saveAuthSession({
      token: "token-rede",
      refreshToken: "refresh-rede",
      networkSubdomain: "rede-norte",
      forcePasswordChangeRequired: true,
    });

    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          message: "Senha alterada com sucesso.",
        },
      },
    ]);

    try {
      const response = await changeForcedPasswordApi({
        newPassword: "NovaSenha123",
        confirmNewPassword: "NovaSenha123",
      });

      expect(response.message).toBe("Senha alterada com sucesso.");
      expect(calls[0]?.url).toContain("/api/v1/auth/change-password");
      expect(calls[0]?.method).toBe("POST");
      expect(calls[0]?.headers.get("X-Rede-Identifier")).toBe("rede-norte");
      expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
        newPassword: "NovaSenha123",
        confirmNewPassword: "NovaSenha123",
      });
      expect(getForcePasswordChangeRequiredFromSession()).toBe(false);
    } finally {
      restore();
    }
  });
});
