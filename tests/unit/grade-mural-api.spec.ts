import { expect, test } from "@playwright/test";
import { getGradeMuralSnapshotApi } from "../../src/lib/api/grade-mural";
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

function mockFetch(body: unknown) {
  const calls: Array<{ url: string; method: string }> = [];
  const previousFetch = global.fetch;

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      method: init?.method ?? "GET",
    });

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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
});

test.afterEach(() => {
  clearAuthSession();
  browser?.restore();
  process.env.NEXT_PUBLIC_API_BASE_URL = envSnapshot.apiBaseUrl;
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = envSnapshot.devAutoLogin;
});

test.describe("grade mural api", () => {
  test("normaliza o mural semanal usando a unidade ativa da sessão", async () => {
    saveAuthSession({
      token: "access-token",
      refreshToken: "refresh-token",
      activeTenantId: "tn-1",
      availableTenants: [{ tenantId: "tn-1", defaultTenant: true }],
    });

    const { calls, restore } = mockFetch({
      tenant: {
        id: "tn-1",
        nome: "Unidade Centro",
        academiaId: "acd-1",
      },
      academia: {
        id: "acd-1",
        nome: "Rede Fit",
        branding: {
          logoUrl: "https://cdn.example/logo.png",
        },
      },
      days: [
        {
          dayTag: "SEG",
          date: "2026-03-09",
          horarioDia: {
            dia: "SEG",
            abre: "06:00",
            fecha: "22:00",
            fechado: false,
          },
          itens: [
            {
              id: "gr-1",
              horaInicio: "08:00",
              horaFim: "09:00",
              capacidade: 20,
              checkinLiberadoMinutosAntes: 45,
              atividade: {
                nome: "Bike",
                permiteCheckin: true,
                checkinObrigatorio: true,
              },
              sala: {
                nome: "Studio 1",
              },
              funcionario: {
                nome: "Paula",
              },
            },
          ],
        },
        {
          dayTag: "TER",
          date: "2026-03-10",
          horarioDia: {
            dia: "TER",
            abre: "06:00",
            fecha: "22:00",
            fechado: false,
          },
          itens: [],
        },
      ],
    });

    try {
      const snapshot = await getGradeMuralSnapshotApi({ date: "2026-03-10" });

      expect(snapshot.tenant.nome).toBe("Unidade Centro");
      expect(snapshot.academia.nome).toBe("Rede Fit");
      expect(snapshot.weekStart).toBe("2026-03-09");
      expect(snapshot.weekEnd).toBe("2026-03-10");
      expect(snapshot.days[0]?.itens[0]?.atividade?.nome).toBe("Bike");
      expect(snapshot.days[0]?.itens[0]?.funcionario?.nome).toBe("Paula");

      expect(calls).toHaveLength(1);
      expect(calls[0]?.url).toContain("/api/v1/grade/mural/tn-1");
      expect(calls[0]?.url).toContain("date=2026-03-10");
    } finally {
      restore();
    }
  });
});
