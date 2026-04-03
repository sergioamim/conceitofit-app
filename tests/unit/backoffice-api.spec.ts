import { expect, test } from "@playwright/test";
import {
  createBackofficeAcademiaApi,
  createBackofficeUnidadeApi,
  listBackofficeAcademiasApi,
} from "../../src/backoffice/api/backoffice";
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
    availableTenants: [{ tenantId: "tenant-backoffice", defaultTenant: true }],
    activeTenantId: "tenant-backoffice",
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

test.describe("backoffice api contracts", () => {
  test("listBackofficeAcademiasApi normaliza envelope paginado do admin", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          items: [
            {
              id: "acd-1",
              nome: "Rede Norte",
              documento: "12.345.678/0001-90",
              email: "norte@example.com",
              ativo: "true",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      const academias = await listBackofficeAcademiasApi();
      expect(calls).toHaveLength(1);
      expect(calls[0].url).toContain("/api/v1/admin/academias");
      expect(academias).toEqual([
        expect.objectContaining({
          id: "acd-1",
          nome: "Rede Norte",
          documento: "12.345.678/0001-90",
          email: "norte@example.com",
          ativo: true,
        }),
      ]);
    } finally {
      restore();
    }
  });

  test("createBackofficeAcademiaApi envia payload alinhado ao cadastro global", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          id: "acd-2",
          nome: "Rede Sul",
          documento: "98.765.432/0001-10",
          ativo: true,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      await createBackofficeAcademiaApi({
        nome: " Rede Sul ",
        documento: " 98.765.432/0001-10 ",
        email: " sul@example.com ",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].url).toContain("/api/v1/admin/academias");
      expect(JSON.parse(calls[0].body ?? "{}")).toEqual({
        nome: "Rede Sul",
        razaoSocial: undefined,
        documento: "98.765.432/0001-10",
        email: "sul@example.com",
        telefone: undefined,
        endereco: undefined,
        branding: undefined,
        ativo: true,
      });
    } finally {
      restore();
    }
  });

  test("createBackofficeUnidadeApi envia academia, grupo e configuração operacional", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          id: "tnt-1",
          academiaId: "acd-1",
          nome: "Unidade Moema",
          groupId: "GRP-MOEMA",
          configuracoes: { impressaoCupom: { modo: "CUSTOM", larguraCustomMm: 92 } },
          ativo: true,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      await createBackofficeUnidadeApi({
        academiaId: "acd-1",
        nome: " Unidade Moema ",
        groupId: " GRP-MOEMA ",
        subdomain: " moema ",
        configuracoes: {
          impressaoCupom: {
            modo: "CUSTOM",
            larguraCustomMm: 92,
          },
        },
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].url).toContain("/api/v1/admin/unidades");
      expect(JSON.parse(calls[0].body ?? "{}")).toEqual({
        academiaId: "acd-1",
        nome: "Unidade Moema",
        razaoSocial: undefined,
        documento: undefined,
        groupId: "GRP-MOEMA",
        subdomain: "moema",
        email: undefined,
        telefone: undefined,
        endereco: undefined,
        branding: undefined,
        configuracoes: {
          impressaoCupom: {
            modo: "CUSTOM",
            larguraCustomMm: 92,
          },
        },
        ativo: true,
      });
    } finally {
      restore();
    }
  });
});
