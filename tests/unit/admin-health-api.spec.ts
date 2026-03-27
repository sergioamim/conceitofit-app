import { expect, test } from "@playwright/test";
import { getAcademiasHealthMap } from "../../src/lib/api/admin-metrics";
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

function installMockBrowser(): MockBrowser {
  const globalRef = globalThis as typeof globalThis & {
    window?: Window & typeof globalThis;
  };
  const previousWindow = globalRef.window;
  globalRef.window = {
    localStorage: new MemoryStorage(),
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

function mockFetch(response: Response) {
  const calls: Array<{ url: string; method: string }> = [];
  const previousFetch = global.fetch;
  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      method: init?.method ?? "GET",
    });
    return response;
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

test.describe("admin health api", () => {
  test("normaliza aliases do mapa de saúde e classifica academia crítica", async () => {
    const loginAntigo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
    const { calls, restore } = mockFetch(
      new Response(
        JSON.stringify({
          data: {
            academias: [
              {
                academiaId: "acd-1",
                nome: "Rede Norte",
                totalUnidades: 2,
                totalAlunosAtivos: 6,
                churn: "11.5",
                inadimplenciaPct: "23.8",
                ultimoLoginAdministrador: loginAntigo,
                contratoStatus: "EM_RISCO",
                plano: "Starter",
                alertas: [],
              },
            ],
            generatedAt: "2026-03-27T14:00:00",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    try {
      const result = await getAcademiasHealthMap();

      expect(calls).toHaveLength(1);
      expect(calls[0]?.url).toContain("/api/v1/admin/metricas/operacionais/saude");
      expect(result.generatedAt).toBe("2026-03-27T14:00:00");
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(
        expect.objectContaining({
          academiaId: "acd-1",
          academiaNome: "Rede Norte",
          unidades: 2,
          alunosAtivos: 6,
          churnMensal: 11.5,
          inadimplenciaPercentual: 23.8,
          statusContrato: "EM_RISCO",
          planoContratado: "Starter",
          healthLevel: "CRITICO",
        })
      );
      expect(result.items[0]?.alertasRisco).toEqual(
        expect.arrayContaining(["Base de alunos abaixo de 10 ativos.", "Inadimplência acima de 20%."])
      );
    } finally {
      restore();
    }
  });
});
