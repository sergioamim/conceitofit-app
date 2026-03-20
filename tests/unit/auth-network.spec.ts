import { expect, test } from "@playwright/test";
import { loginApi } from "../../src/lib/api/auth";
import { getSessionBootstrapApi } from "../../src/lib/api/contexto-unidades";
import {
  clearAuthSession,
  getAvailableScopesFromSession,
  getBroadAccessFromSession,
  getNetworkSlugFromSession,
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
      expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
        redeIdentifier: "rede-norte",
        identifier: "ana@qa.local",
        password: "12345678",
        channel: "APP",
      });
      expect(session.networkSlug).toBe("rede-norte");
      expect(session.baseTenantId).toBe("tenant-base");
      expect(getNetworkSlugFromSession()).toBe("rede-norte");
      expect(getAvailableScopesFromSession()).toEqual(["REDE"]);
      expect(getBroadAccessFromSession()).toBeTruthy();
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
});
