import { expect, test } from "@playwright/test";
import { getMetricasOperacionaisGlobal } from "../../src/backoffice/api/admin-metrics";
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

function mockFetch(
  response: Response | ((call: FetchCall) => Response | Promise<Response>)
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
    availableTenants: [{ tenantId: "tenant-admin", defaultTenant: true }],
    activeTenantId: "tenant-admin",
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

test.describe("admin metrics api", () => {
  test("normaliza envelope e aliases do dashboard operacional global", async () => {
    const { calls, restore } = mockFetch(
      new Response(
        JSON.stringify({
          data: {
            totalAlunosAtivos: "245",
            totalMatriculasAtivas: 210,
            quantidadeVendasMes: "38",
            valorVendasMes: "28990.50",
            ticketMedio: "763.96",
            novasMatriculasMes: 17,
            novasMatriculasMesAnterior: 10,
            novosAlunosPorMes: [
              { mes: "2026-01", label: "jan/26", quantidade: 9 },
              { mes: "2026-02", label: "fev/26", quantidade: 12 },
            ],
            academias: [
              {
                academiaId: "acd-1",
                nome: "Rede Centro",
                totalUnidades: 4,
                alunos: 150,
                matriculas: 130,
                vendasQuantidade: 20,
                vendasValor: 15000,
              },
            ],
            generatedAt: "2026-03-27T12:00:00",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    try {
      const result = await getMetricasOperacionaisGlobal();

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("GET");
      expect(calls[0].url).toContain("/api/v1/admin/metricas/operacionais/global");
      expect(result).toEqual({
        totalAlunosAtivos: 245,
        totalMatriculasAtivas: 210,
        vendasMesQuantidade: 38,
        vendasMesValor: 28990.5,
        ticketMedioGlobal: 763.96,
        novosAlunosMes: 17,
        novosAlunosMesAnterior: 10,
        tendenciaCrescimentoPercentual: 70,
        evolucaoNovosAlunos: [
          { referencia: "2026-01", label: "jan/26", total: 9 },
          { referencia: "2026-02", label: "fev/26", total: 12 },
        ],
        distribuicaoAcademias: [
          {
            academiaId: "acd-1",
            academiaNome: "Rede Centro",
            unidades: 4,
            alunosAtivos: 150,
            matriculasAtivas: 130,
            vendasMesQuantidade: 20,
            vendasMesValor: 15000,
            ticketMedio: 750,
          },
        ],
        generatedAt: "2026-03-27T12:00:00",
      });
    } finally {
      restore();
    }
  });
});
