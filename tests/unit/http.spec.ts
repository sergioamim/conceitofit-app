import { expect, test } from "@playwright/test";
import { apiRequest } from "../../src/lib/api/http";
import {
  clearAuthSession,
  getActiveTenantIdFromSession,
  getAvailableTenantsFromSession,
  saveAuthSession,
  setPreferredTenantId,
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

type FetchCall = {
  url: string;
  method: string;
  headers: Headers;
};

function installMockBrowser(): MockBrowser {
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

test.describe("http apiRequest", () => {
  test("remove tenantId redundante em rota comercial tenant-scoped quando o contexto ativo ja esta presente", async () => {
    saveAuthSession({
      token: "access-token",
      refreshToken: "refresh-token",
      activeTenantId: "tenant-active",
      availableTenants: [
        { tenantId: "tenant-active", defaultTenant: true },
        { tenantId: "tenant-secondary", defaultTenant: false },
      ],
    });

    const { calls, restore } = mockFetchSequence([
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    try {
      await apiRequest<unknown[]>({
        path: "/api/v1/comercial/matriculas",
        query: {
          tenantId: "tenant-secondary",
          status: "ATIVA",
        },
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toContain("/api/v1/comercial/matriculas");
      expect(calls[0].url).not.toContain("tenantId=");
      expect(calls[0].url).toContain("status=ATIVA");
      expect(calls[0].headers.get("X-Context-Id")).toBeTruthy();
      expect(calls[0].headers.get("Authorization")).toBe("Bearer access-token");
    } finally {
      restore();
    }
  });

  test("remove tenantId redundante em outras rotas operacionais tenant-scoped", async () => {
    saveAuthSession({
      token: "access-token",
      refreshToken: "refresh-token",
      activeTenantId: "tenant-active",
      availableTenants: [{ tenantId: "tenant-active", defaultTenant: true }],
    });

    const { calls, restore } = mockFetchSequence([
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    try {
      await apiRequest<unknown[]>({
        path: "/api/v1/crm/tarefas",
        query: {
          tenantId: "tenant-secondary",
          status: "PENDENTE",
        },
      });
      await apiRequest<unknown[]>({
        path: "/api/v1/administrativo/atividades",
        query: {
          tenantId: "tenant-secondary",
          apenasAtivas: true,
        },
      });
      await apiRequest<unknown[]>({
        path: "/api/v1/gerencial/financeiro/contas-pagar",
        query: {
          tenantId: "tenant-secondary",
          status: "PENDENTE",
        },
      });

      expect(calls).toHaveLength(3);
      expect(calls[0].url).toContain("/api/v1/crm/tarefas");
      expect(calls[0].url).not.toContain("tenantId=");
      expect(calls[1].url).toContain("/api/v1/administrativo/atividades");
      expect(calls[1].url).not.toContain("tenantId=");
      expect(calls[2].url).toContain("/api/v1/gerencial/financeiro/contas-pagar");
      expect(calls[2].url).not.toContain("tenantId=");
    } finally {
      restore();
    }
  });

  test("preserva tenantId em rotas globais que ainda exigem tenant explicito", async () => {
    saveAuthSession({
      token: "access-token",
      refreshToken: "refresh-token",
      activeTenantId: "tenant-active",
      availableTenants: [{ tenantId: "tenant-active", defaultTenant: true }],
    });

    const { calls, restore } = mockFetchSequence([
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    try {
      await apiRequest<unknown[]>({
        path: "/api/v1/academia/prospects",
        query: {
          tenantId: "tenant-secondary",
          status: "NOVO",
        },
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toContain("tenantId=tenant-secondary");
      expect(calls[0].url).toContain("status=NOVO");
    } finally {
      restore();
    }
  });

  test("injeta tenantId da sessao quando a rota ainda depende de tenant explicito", async () => {
    saveAuthSession({
      token: "access-token",
      refreshToken: "refresh-token",
      activeTenantId: "tenant-active",
      availableTenants: [{ tenantId: "tenant-active", defaultTenant: true }],
    });
    setPreferredTenantId("tenant-preferred");

    const { calls, restore } = mockFetchSequence([
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    try {
      await apiRequest<unknown[]>({
        path: "/api/v1/academia/prospects",
        query: { status: "NOVO" },
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toContain("tenantId=tenant-active");
      expect(calls[0].url).toContain("status=NOVO");
    } finally {
      restore();
    }
  });

  test("mantem tenantId explicito em rota operacional quando a requisicao nao usa contexto", async () => {
    saveAuthSession({
      token: "access-token",
      refreshToken: "refresh-token",
      activeTenantId: "tenant-active",
      availableTenants: [{ tenantId: "tenant-active", defaultTenant: true }],
    });

    const { calls, restore } = mockFetchSequence([
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    try {
      await apiRequest<unknown[]>({
        path: "/api/v1/comercial/matriculas",
        includeContextHeader: false,
        query: {
          tenantId: "tenant-secondary",
          status: "ATIVA",
        },
      });

      await apiRequest<unknown[]>({
        path: "/api/v1/comercial/matriculas",
        includeContextHeader: false,
        query: {
          status: "ATIVA",
        },
      });

      expect(calls).toHaveLength(2);
      expect(calls[0].url).toContain("tenantId=tenant-secondary");
      expect(calls[0].headers.get("X-Context-Id")).toBeNull();
      expect(calls[1].url).toContain("tenantId=tenant-active");
      expect(calls[1].headers.get("X-Context-Id")).toBeNull();
    } finally {
      restore();
    }
  });

  test("faz refresh do token, reaproveita contexto do tenant e repete a requisicao", async () => {
    saveAuthSession({
      token: "token-expired",
      refreshToken: "refresh-token",
      type: "Bearer",
      activeTenantId: "tenant-active",
      availableTenants: [
        { tenantId: "tenant-active", defaultTenant: true },
        { tenantId: "tenant-secondary", defaultTenant: false },
      ],
    });

    const { calls, restore } = mockFetchSequence([
      new Response(JSON.stringify({ message: "expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
      new Response(JSON.stringify({ token: "token-fresh" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    try {
      const response = await apiRequest<{ ok: boolean }>({
        path: "/api/v1/administrativo/cargos",
      });

      expect(response.ok).toBe(true);
      expect(calls).toHaveLength(3);
      expect(calls[0].headers.get("Authorization")).toBe("Bearer token-expired");
      expect(calls[1].url).toContain("/api/v1/auth/refresh");
      expect(calls[2].headers.get("Authorization")).toBe("Bearer token-fresh");
      expect(calls[2].url).not.toContain("tenantId=");
      expect(calls[2].headers.get("X-Context-Id")).toBeTruthy();
      expect(getActiveTenantIdFromSession()).toBe("tenant-active");
      expect(getAvailableTenantsFromSession().map((item) => item.tenantId)).toEqual([
        "tenant-active",
        "tenant-secondary",
      ]);
    } finally {
      restore();
    }
  });

  test("normaliza erro de texto puro e preserva o context id", async () => {
    const { restore } = mockFetchSequence([
      new Response("backend unavailable", {
        status: 503,
        headers: { "X-Context-Id": "ctx-123" },
      }),
    ]);

    try {
      await expect(async () =>
        apiRequest({
          path: "/api/v1/context/tenant-atual",
          includeContextHeader: false,
        })
      ).rejects.toMatchObject({
        message: "backend unavailable",
        status: 503,
        responseBody: "backend unavailable",
        contextId: "ctx-123",
      });
    } finally {
      restore();
    }
  });

  test("retorna undefined quando o backend responde 200 sem corpo", async () => {
    const { restore } = mockFetchSequence([
      new Response("", {
        status: 200,
      }),
    ]);

    try {
      await expect(
        apiRequest<void>({
          path: "/api/v1/context/tenant-atual",
          includeContextHeader: false,
        })
      ).resolves.toBeUndefined();
    } finally {
      restore();
    }
  });
});
