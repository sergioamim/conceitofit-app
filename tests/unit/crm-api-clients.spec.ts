import { expect, test } from "@playwright/test";
import {
  createCrmCampanhaApi,
  createCrmTaskApi,
  dispararCrmCampanhaApi,
  listCrmCadenciasApi,
} from "../../src/lib/api/crm";
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

type FetchCall = {
  url: string;
  method: string;
  headers: Headers;
  body?: string;
};

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

function mockFetchSequence(
  responses: Array<Response | ((call: FetchCall) => Response | Promise<Response>)>
) {
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

let browser: ReturnType<typeof installMockBrowser> | undefined;

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
    activeTenantId: "tenant-crm",
    availableTenants: [{ tenantId: "tenant-crm", defaultTenant: true }],
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

test.describe("crm api clients", () => {
  test("createCrmTaskApi envia POST tipado para tarefas CRM", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          id: "task-1",
          tenantId: "tenant-crm",
          titulo: "Retornar lead",
          tipo: "FOLLOW_UP",
          prioridade: "ALTA",
          status: "PENDENTE",
          origem: "MANUAL",
          vencimentoEm: "2026-03-12T09:00:00",
          dataCriacao: "2026-03-12T08:00:00",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      await createCrmTaskApi({
        tenantId: "tenant-crm",
        data: {
          titulo: "Retornar lead",
          tipo: "FOLLOW_UP",
          prioridade: "ALTA",
          status: "PENDENTE",
          vencimentoEm: "2026-03-12T09:00:00",
        },
      });

      expect(calls).toHaveLength(1);
      expect(calls[0]?.method).toBe("POST");
      expect(calls[0]?.url).toContain("/api/v1/crm/tarefas");
      expect(calls[0]?.url).not.toContain("tenantId=");
      expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
        titulo: "Retornar lead",
        tipo: "FOLLOW_UP",
        prioridade: "ALTA",
        status: "PENDENTE",
        vencimentoEm: "2026-03-12T09:00:00",
      });
    } finally {
      restore();
    }
  });

  test("listCrmCadenciasApi usa endpoint dedicado com tenantId", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(JSON.stringify([{ id: "cad-1", tenantId: "tenant-crm", nome: "Cadência 1", objetivo: "Teste", stageStatus: "NOVO", gatilho: "NOVO_PROSPECT", ativo: true, passos: [], dataCriacao: "2026-03-12T08:00:00" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    try {
      const rows = await listCrmCadenciasApi({ tenantId: "tenant-crm" });
      expect(rows).toHaveLength(1);
      expect(calls[0]?.method).toBe("GET");
      expect(calls[0]?.url).toContain("/api/v1/crm/cadencias");
      expect(calls[0]?.url).not.toContain("tenantId=");
    } finally {
      restore();
    }
  });

  test("campanhas CRM usam endpoints explícitos e retornam mensagem amigável em 404", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(JSON.stringify({ message: "missing" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
      new Response(
        JSON.stringify({
          id: "camp-1",
          tenantId: "tenant-crm",
          nome: "Reativação",
          publicoAlvo: "ALUNOS_INATIVOS",
          canais: ["WHATSAPP"],
          dataInicio: "2026-03-12",
          status: "ATIVA",
          disparosRealizados: 1,
          ultimaExecucao: "2026-03-12T09:00:00",
          dataCriacao: "2026-03-12T08:00:00",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      await expect(
        createCrmCampanhaApi({
          tenantId: "tenant-crm",
          data: {
            nome: "Reativação",
            publicoAlvo: "ALUNOS_INATIVOS",
            canais: ["WHATSAPP"],
            dataInicio: "2026-03-12",
            status: "RASCUNHO",
          },
        })
      ).rejects.toThrow("Backend ainda não expõe criação de campanhas CRM neste ambiente.");

      const updated = await dispararCrmCampanhaApi({
        tenantId: "tenant-crm",
        id: "camp-1",
      });
      expect(updated.status).toBe("ATIVA");
      expect(calls[0]?.url).toContain("/api/v1/crm/campanhas");
      expect(calls[1]?.url).toContain("/api/v1/crm/campanhas/camp-1/disparar");
    } finally {
      restore();
    }
  });
});
