import { expect, test } from "@playwright/test";
import { listAlunosApi } from "../../src/lib/api/alunos";
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
};

function installMockBrowser(): MockBrowser {
  const globalRef = globalThis as typeof globalThis & {
    window?: Window & typeof globalThis;
    document?: Document;
  };
  const previousWindow = globalRef.window;
  const previousDocument = globalRef.document;
  const storage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  const target = new EventTarget();
  const documentRef = {
    cookie: "",
  } as Document;
  globalRef.window = {
    localStorage: storage,
    sessionStorage,
    location: {
      protocol: "http:",
    } as Location,
    document: documentRef,
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target),
  } as unknown as Window & typeof globalThis;
  globalRef.document = documentRef;

  return {
    restore() {
      if (previousDocument === undefined) {
        Reflect.deleteProperty(globalRef, "document");
      } else {
        globalRef.document = previousDocument;
      }
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
  saveAuthSession({
    token: "access-token",
    refreshToken: "refresh-token",
    availableTenants: [{ tenantId: "tenant-clientes", defaultTenant: true }],
    activeTenantId: "tenant-clientes",
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

test.describe("alunos api", () => {
  test("envia a busca textual somente quando informada e preserva o contexto operacional", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          items: [],
          page: 0,
          size: 12,
          hasNext: false,
          totaisStatus: {
            total: 0,
            ativos: 0,
            suspensos: 0,
            inativos: 0,
            cancelados: 0,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      await listAlunosApi({
        tenantId: "tenant-clientes",
        search: "ana",
        page: 0,
        size: 12,
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("GET");
      expect(calls[0].url).toContain("/backend/api/v1/comercial/alunos");
      expect(calls[0].url).toContain("search=ana");
      expect(calls[0].url).toContain("page=0");
      expect(calls[0].url).toContain("size=12");
      expect(calls[0].url).toContain("envelope=true");
      expect(calls[0].headers.get("Authorization")).toBeNull();
      expect(calls[0].headers.get("X-Context-Id")).toBeTruthy();
    } finally {
      restore();
    }
  });

  test("normaliza a foto do aluno para o endpoint servido pelo backend", async () => {
    const { restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          items: [
            {
              id: "7ef2d531-c2b8-4f67-93da-88e72b310163",
              tenantId: "tenant-clientes",
              nome: "Ana Cliente",
              email: "ana@qa.local",
              telefone: "11999999999",
              cpf: "12345678900",
              dataNascimento: "1990-01-01",
              sexo: "F",
              status: "ATIVO",
              foto: "data:image/jpeg;base64,abc123",
              dataCadastro: "2026-04-05T10:15:30",
            },
          ],
          page: 0,
          size: 1,
          hasNext: false,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    ]);

    try {
      const response = await listAlunosApi({
        tenantId: "tenant-clientes",
        page: 0,
        size: 1,
      });

      expect(response.items[0]?.foto).toBe(
        "/api/v1/comercial/alunos/7ef2d531-c2b8-4f67-93da-88e72b310163/foto?v=2026-04-05T10%3A15%3A30",
      );
    } finally {
      restore();
    }
  });
});
