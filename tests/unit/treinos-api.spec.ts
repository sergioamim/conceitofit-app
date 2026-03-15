import { expect, test } from "@playwright/test";
import { assignTreinoTemplateApi, listTreinoTemplatesApi } from "../../src/lib/api/treinos";
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
    token: "access-token",
    refreshToken: "refresh-token",
    availableTenants: [{ tenantId: "tenant-treinos", defaultTenant: true }],
    activeTenantId: "tenant-treinos",
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

test.describe("treinos api contracts", () => {
  test("listTreinoTemplatesApi usa o endpoint canônico com tenantId e headers de contexto", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          items: [
            {
              id: "tpl-1",
              nome: "Template Base",
              professorId: "prof-1",
              professorNome: "Paula Lima",
              status: "PUBLICADO",
              versaoTemplate: 3,
              precisaRevisao: false,
              pendenciasAbertas: 0,
              atualizadoEm: "2026-03-14T22:33:28.692Z",
            },
          ],
          page: 0,
          size: 12,
          total: 1,
          hasNext: false,
          totais: {
            totalTemplates: 1,
            publicados: 1,
            emRevisao: 0,
            comPendencias: 0,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      const response = await listTreinoTemplatesApi({
        tenantId: "tenant-treinos",
        search: "Base",
        page: 0,
        size: 12,
      });

      expect(response.items).toHaveLength(1);
      expect(response.totais.totalTemplates).toBe(1);
      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("GET");
      expect(calls[0].url).toContain("/backend/api/v1/treinos/templates");
      expect(calls[0].url).toContain("tenantId=tenant-treinos");
      expect(calls[0].url).toContain("page=0");
      expect(calls[0].url).toContain("size=12");
      expect(calls[0].url).not.toContain("tipoTreino=PRE_MONTADO");
      expect(calls[0].headers.get("Authorization")).toBe("Bearer access-token");
      expect(calls[0].headers.get("X-Context-Id")).toBeTruthy();
    } finally {
      restore();
    }
  });

  test("assignTreinoTemplateApi usa a rota canônica de templates", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          id: "trn-1",
          tenantId: "tenant-treinos",
          clienteId: "cli-1",
          nome: "Treino atribuído",
          templateNome: "Template Base",
          tipoTreino: "CUSTOMIZADO",
          ativo: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      await assignTreinoTemplateApi({
        tenantId: "tenant-treinos",
        id: "tpl-1",
        data: {
          destinoTipo: "CLIENTE",
          clienteId: "cli-1",
          dataInicio: "2026-03-14",
          dataFim: "2026-04-11",
        },
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].url).toContain("/backend/api/v1/treinos/templates/tpl-1/atribuir");
    } finally {
      restore();
    }
  });

  test("assignTreinoTemplateApi faz fallback para a rota legada quando a canônica retorna 404", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          timestamp: "2026-03-14T22:33:28.692+00:00",
          status: 404,
          error: "Not Found",
          path: "/api/v1/treinos/templates/tpl-1/atribuir",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      ),
      new Response(
        JSON.stringify({
          id: "trn-2",
          tenantId: "tenant-treinos",
          clienteId: "cli-1",
          nome: "Treino atribuído",
          templateNome: "Template Base",
          tipoTreino: "CUSTOMIZADO",
          ativo: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      await assignTreinoTemplateApi({
        tenantId: "tenant-treinos",
        id: "tpl-1",
        data: {
          destinoTipo: "CLIENTE",
          clienteId: "cli-1",
        },
      });

      expect(calls).toHaveLength(2);
      expect(calls[0].url).toContain("/backend/api/v1/treinos/templates/tpl-1/atribuir");
      expect(calls[1].url).toContain("/backend/api/v1/treinos/tpl-1/atribuir");
    } finally {
      restore();
    }
  });
});
