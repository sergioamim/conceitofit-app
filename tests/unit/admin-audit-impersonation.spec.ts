import { expect, test } from "@playwright/test";
import { endImpersonationApi, impersonateUserApi } from "../../src/backoffice/api/admin-audit";
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

type MockBrowser = {
  restore(): void;
};

type FetchCall = {
  url: string;
  method: string;
  headers: Headers;
  body?: string;
};

function installMockBrowser(): MockBrowser {
  const globalRef = globalThis as typeof globalThis & {
    window?: Window & typeof globalThis;
  };
  const previousWindow = globalRef.window;
  const storage = new MemoryStorage();
  globalRef.window = {
    localStorage: storage,
    sessionStorage: new MemoryStorage(),
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

function mockFetchSequence(
  responses: Array<Response | ((call: FetchCall) => Response | Promise<Response>)>
): {
  calls: FetchCall[];
  restore(): void;
} {
  const calls: FetchCall[] = [];
  const previousFetch = global.fetch;

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: FetchCall = {
      url: String(input),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body: typeof init?.body === "string" ? init.body : undefined,
    };
    calls.push(call);
    const response = responses[calls.length - 1];
    if (!response) {
      throw new Error(`Unexpected fetch call ${calls.length}: ${call.method} ${call.url}`);
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

const runtimeSnapshot = {
  forceLocalMode: (
    globalThis as typeof globalThis & {
      __ACADEMIA_FORCE_LOCAL_MODE__?: boolean;
    }
  ).__ACADEMIA_FORCE_LOCAL_MODE__,
};

let browser: MockBrowser | undefined;

test.beforeEach(() => {
  browser = installMockBrowser();
  process.env.NEXT_PUBLIC_API_BASE_URL = "";
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
  (
    globalThis as typeof globalThis & {
      __ACADEMIA_FORCE_LOCAL_MODE__?: boolean;
    }
  ).__ACADEMIA_FORCE_LOCAL_MODE__ = true;
  clearAuthSession();
  saveAuthSession({
    token: "token-admin",
    refreshToken: "refresh-admin",
    activeTenantId: "tenant-centro",
    availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
  });
});

test.afterEach(() => {
  clearAuthSession();
  browser?.restore();
  process.env.NEXT_PUBLIC_API_BASE_URL = envSnapshot.apiBaseUrl;
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = envSnapshot.devAutoLogin;
  if (runtimeSnapshot.forceLocalMode === undefined) {
    delete (
      globalThis as typeof globalThis & {
        __ACADEMIA_FORCE_LOCAL_MODE__?: boolean;
      }
    ).__ACADEMIA_FORCE_LOCAL_MODE__;
  } else {
    (
      globalThis as typeof globalThis & {
        __ACADEMIA_FORCE_LOCAL_MODE__?: boolean;
      }
    ).__ACADEMIA_FORCE_LOCAL_MODE__ = runtimeSnapshot.forceLocalMode;
  }
});

test.describe("admin audit impersonation api", () => {
  test("impersonateUserApi normaliza a sessão temporária", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          auditContextId: "audit-imp-1",
          targetUserId: "user-bruno",
          targetUserName: "Bruno Suporte",
          redirectTo: "/dashboard",
          session: {
            token: "token-bruno",
            refreshToken: "refresh-bruno",
            type: "Bearer",
            userId: "user-bruno",
            userKind: "COLABORADOR",
            displayName: "Bruno Suporte",
            redeId: "rede-norte",
            redeSubdominio: "rede-norte",
            redeNome: "Rede Norte",
            activeTenantId: "tenant-centro",
            tenantBaseId: "tenant-centro",
            availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
            availableScopes: ["UNIDADE"],
            broadAccess: false,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      const response = await impersonateUserApi({
        userId: "user-bruno",
        tenantId: "tenant-centro",
        justification: "Diagnóstico remoto",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].url).toContain("/api/v1/administrativo/audit-log/usuarios/user-bruno/impersonate");
      expect(calls[0].url).toContain("tenantId=tenant-centro");
      expect(JSON.parse(calls[0].body ?? "{}")).toEqual({ justificativa: "Diagnóstico remoto" });
      expect(response).toEqual({
        auditContextId: "audit-imp-1",
        targetUserId: "user-bruno",
        targetUserName: "Bruno Suporte",
        redirectTo: "/dashboard",
        session: {
          token: "token-bruno",
          refreshToken: "refresh-bruno",
          type: "Bearer",
          userId: "user-bruno",
          userKind: "COLABORADOR",
          displayName: "Bruno Suporte",
          networkId: "rede-norte",
          networkSubdomain: "rede-norte",
          networkSlug: "rede-norte",
          networkName: "Rede Norte",
          activeTenantId: "tenant-centro",
          baseTenantId: "tenant-centro",
          availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
          availableScopes: ["UNIDADE"],
          broadAccess: false,
        },
      });
    } finally {
      restore();
    }
  });

  test("endImpersonationApi envia o contexto de auditoria do encerramento", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(null, { status: 204 }),
    ]);

    try {
      await endImpersonationApi({
        auditContextId: "audit-imp-1",
        targetUserId: "user-bruno",
        targetUserName: "Bruno Suporte",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].url).toContain("/api/v1/administrativo/audit-log/impersonation/end");
      expect(JSON.parse(calls[0].body ?? "{}")).toEqual({
        auditContextId: "audit-imp-1",
        targetUserId: "user-bruno",
        targetUserName: "Bruno Suporte",
      });
    } finally {
      restore();
    }
  });
});
