import { expect, test } from "@playwright/test";
import {
  getGlobalAdminUserDetailApi,
  listGlobalAdminUsersApi,
} from "../../src/lib/api/backoffice-seguranca";
import {
  listEligibleNewUnitAdminsPreview,
  updateUserNewUnitsPolicy,
} from "../../src/lib/backoffice/seguranca";
import { clearAuthSession, saveAuthSession } from "../../src/lib/api/session";

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

function installMockBrowser() {
  const globalRef = globalThis as typeof globalThis & {
    window?: Window & typeof globalThis;
  };
  const previousWindow = globalRef.window;
  const storage = new MemoryStorage();
  globalRef.window = {
    localStorage: storage,
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

type FetchCall = {
  url: string;
  method: string;
  body?: string;
};

function mockFetchSequence(
  responses: Array<Response | ((call: FetchCall) => Response | Promise<Response>)>
) {
  const previousFetch = global.fetch;
  const calls: FetchCall[] = [];

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: FetchCall = {
      url: String(input),
      method: init?.method ?? "GET",
      body: typeof init?.body === "string" ? init.body : undefined,
    };
    calls.push(call);
    const response = responses[calls.length - 1];
    if (!response) {
      throw new Error(`Unexpected fetch ${call.method} ${call.url}`);
    }
    return response instanceof Response ? response : response(call);
  }) as typeof global.fetch;

  return {
    calls,
    restore() {
      global.fetch = previousFetch;
    },
  };
}

const envSnapshot = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  devAutoLogin: process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN,
};

let browser: ReturnType<typeof installMockBrowser> | undefined;

test.beforeEach(() => {
  browser = installMockBrowser();
  process.env.NEXT_PUBLIC_API_BASE_URL = "";
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
  clearAuthSession();
  saveAuthSession({
    token: "token-security",
    refreshToken: "refresh-security",
    activeTenantId: "tenant-centro",
    availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
  });
});

test.afterEach(() => {
  clearAuthSession();
  browser?.restore();
  process.env.NEXT_PUBLIC_API_BASE_URL = envSnapshot.apiBaseUrl;
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = envSnapshot.devAutoLogin;
});

test.describe("backoffice segurança", () => {
  test("listGlobalAdminUsersApi normaliza envelope e badges principais", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          page: 0,
          size: 20,
          hasNext: false,
          total: 1,
          items: [
            {
              id: "user-ana",
              nome: "Ana Admin",
              email: "ana@qa.local",
              status: "ATIVO",
              academias: [{ id: "acd-1", nome: "Rede Norte" }],
              profiles: [{ roleName: "ADMIN", displayName: "Administrador" }],
              membershipsAtivos: 2,
              membershipsTotal: 2,
              defaultTenantId: "tenant-centro",
              defaultTenantName: "Centro",
              eligibleForNewUnits: true,
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      const response = await listGlobalAdminUsersApi({
        academiaId: "acd-1",
        eligibleForNewUnits: true,
        size: 20,
      });

      expect(calls[0]?.url).toContain("/api/v1/admin/seguranca/usuarios");
      expect(calls[0]?.url).toContain("academiaId=acd-1");
      expect(calls[0]?.url).toContain("eligibleForNewUnits=true");
      expect(response.items[0]).toEqual(
        expect.objectContaining({
          id: "user-ana",
          name: "Ana Admin",
          email: "ana@qa.local",
          membershipsAtivos: 2,
          defaultTenantName: "Centro",
          eligibleForNewUnits: true,
          perfis: ["Administrador"],
        })
      );
      expect(response.items[0]?.academias[0]?.nome).toBe("Rede Norte");
    } finally {
      restore();
    }
  });

  test("getGlobalAdminUserDetailApi normaliza memberships, perfis e política", async () => {
    const { restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          id: "user-ana",
          nome: "Ana Admin",
          email: "ana@qa.local",
          active: true,
          academias: [{ id: "acd-1", nome: "Rede Norte" }],
          membershipsAtivos: 1,
          membershipsTotal: 1,
          defaultTenantName: "Centro",
          eligibleForNewUnits: true,
          memberships: [
            {
              id: "mem-centro",
              tenantId: "tenant-centro",
              tenantName: "Centro",
              academiaId: "acd-1",
              academiaName: "Rede Norte",
              active: true,
              defaultTenant: true,
              accessOrigin: "HERDADO",
              inheritedFrom: "Política regional",
              eligibleForNewUnits: true,
              profiles: [
                {
                  perfilId: "perfil-admin",
                  roleName: "ADMIN",
                  displayName: "Administrador",
                  active: true,
                  inherited: true,
                },
              ],
              availableProfiles: [
                {
                  id: "perfil-admin",
                  tenantId: "tenant-centro",
                  roleName: "ADMIN",
                  displayName: "Administrador",
                  active: true,
                },
                {
                  id: "perfil-gerente",
                  tenantId: "tenant-centro",
                  roleName: "GERENTE",
                  displayName: "Gerente",
                  active: true,
                },
              ],
            },
          ],
          policy: {
            autoAssignToNewUnits: true,
            scope: "REDE",
            rationale: "Diretoria regional",
            updatedAt: "2026-03-12T10:00:00",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      const detail = await getGlobalAdminUserDetailApi("user-ana");

      expect(detail.memberships).toHaveLength(1);
      expect(detail.memberships[0]).toEqual(
        expect.objectContaining({
          id: "mem-centro",
          tenantName: "Centro",
          accessOrigin: "HERDADO_POLITICA",
          inheritedFrom: "Política regional",
        })
      );
      expect(detail.memberships[0]?.profiles[0]).toEqual(
        expect.objectContaining({
          roleName: "ADMIN",
          inherited: true,
        })
      );
      expect(detail.memberships[0]?.availableProfiles).toHaveLength(2);
      expect(detail.policy).toEqual(
        expect.objectContaining({
          enabled: true,
          scope: "REDE",
          rationale: "Diretoria regional",
        })
      );
    } finally {
      restore();
    }
  });

  test("services de preview e política usam os endpoints canônicos", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          total: 1,
          items: [
            {
              id: "user-ana",
              nome: "Ana Admin",
              email: "ana@qa.local",
              active: true,
              membershipsAtivos: 1,
              membershipsTotal: 1,
              defaultTenantName: "Centro",
              eligibleForNewUnits: true,
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
      new Response(null, { status: 204 }),
      new Response(
        JSON.stringify({
          id: "user-ana",
          nome: "Ana Admin",
          email: "ana@qa.local",
          active: true,
          membershipsAtivos: 1,
          membershipsTotal: 1,
          defaultTenantName: "Centro",
          eligibleForNewUnits: true,
          memberships: [],
          policy: {
            enabled: true,
            scope: "ACADEMIA_ATUAL",
            rationale: "Direção local",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      const preview = await listEligibleNewUnitAdminsPreview({ academiaId: "acd-1", size: 5 });
      expect(preview.total).toBe(1);
      expect(calls[0]?.url).toContain("eligibleForNewUnits=true");
      expect(calls[0]?.url).toContain("academiaId=acd-1");

      const updated = await updateUserNewUnitsPolicy({
        userId: "user-ana",
        enabled: true,
        scope: "ACADEMIA_ATUAL",
        rationale: "  Direção local  ",
      });

      expect(calls[1]?.url).toContain("/api/v1/admin/seguranca/usuarios/user-ana/policy/new-units");
      expect(calls[1]?.method).toBe("PUT");
      expect(JSON.parse(calls[1]?.body ?? "{}")).toEqual({
        enabled: true,
        scope: "ACADEMIA_ATUAL",
        academiaIds: undefined,
        rationale: "Direção local",
      });
      expect(calls[2]?.url).toContain("/api/v1/admin/seguranca/usuarios/user-ana");
      expect(updated.policy.rationale).toBe("Direção local");
    } finally {
      restore();
    }
  });
});
