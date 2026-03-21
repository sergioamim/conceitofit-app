import { expect, test } from "@playwright/test";
import { createUserApi } from "../../src/lib/api/rbac";
import { clearAuthSession, saveAuthSession } from "../../src/lib/api/session";
import { installMockBrowser, mockFetchWithSequence } from "./support/test-runtime";

let browser: ReturnType<typeof installMockBrowser> | undefined;

test.beforeEach(() => {
  browser = installMockBrowser();
  clearAuthSession();
  saveAuthSession({
    token: "token-rbac",
    refreshToken: "refresh-rbac",
    activeTenantId: "tenant-centro",
    availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
  });
  process.env.NEXT_PUBLIC_API_BASE_URL = "";
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
});

test.afterEach(() => {
  clearAuthSession();
  browser?.restore();
});

test.describe("rbac users api", () => {
  test("createUserApi envia payload restrito ao tenant ativo", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          id: "user-carla",
          tenantId: "tenant-centro",
          name: "Carla Operações",
          fullName: "Carla Operações",
          email: "carla@qa.local",
          active: true,
        },
        status: 201,
      },
    ]);

    try {
      const response = await createUserApi({
        tenantId: "tenant-centro",
        data: {
          name: "Carla Operações",
          fullName: "Carla Operações",
          email: "carla@qa.local",
          userKind: "COLABORADOR",
          networkId: "rede-norte",
          networkName: "Rede Norte",
          networkSubdomain: "rede-norte",
          tenantIds: ["tenant-centro", "tenant-barra"],
          defaultTenantId: "tenant-centro",
          initialPerfilIds: ["perfil-admin"],
          loginIdentifiers: [
            { label: "E-mail", value: "carla@qa.local" },
            { label: "CPF", value: "111.222.333-44" },
          ],
        },
      });

      expect(calls[0]?.url).toContain("/api/v1/auth/users");
      expect(calls[0]?.url).toContain("tenantId=tenant-centro");
      expect(calls[0]?.method).toBe("POST");
      expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
        username: "carla@qa.local",
        email: "carla@qa.local",
        password: "Temp@1234",
        firstName: "Carla",
        lastName: "Operações",
        fullName: "Carla Operações",
        userKind: "COLABORADOR",
        networkId: "rede-norte",
        networkName: "Rede Norte",
        networkSubdomain: "rede-norte",
        tenantIds: ["tenant-centro", "tenant-barra"],
        tenantId: "tenant-centro",
        defaultTenantId: "tenant-centro",
        initialPerfilIds: ["perfil-admin"],
        loginIdentifiers: [
          { label: "E-mail", value: "carla@qa.local" },
          { label: "CPF", value: "111.222.333-44" },
        ],
        active: true,
      });
      expect(response).toEqual({
        id: "user-carla",
        tenantId: "tenant-centro",
        name: "Carla Operações",
        fullName: "Carla Operações",
        email: "carla@qa.local",
        active: true,
      });
    } finally {
      restore();
    }
  });
});
