import { expect, test } from "@playwright/test";
import {
  getFeatureFlagsMatrixApi,
  toggleFeatureForAcademiaApi,
} from "../../src/lib/api/admin-config";
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

test.describe("admin config api contracts", () => {
  test("getFeatureFlagsMatrixApi normaliza a matriz por academia", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          matrix: {
            academias: [
              {
                id: "academia-norte",
                nome: "Rede Norte",
                totalUnidades: 2,
                unidadesAtivas: 1,
              },
            ],
            features: [
              {
                key: "feature.financeiro",
                name: "Gestão financeira",
                module: "Financeiro",
                enabled: true,
                cells: [
                  {
                    id: "academia-norte",
                    nome: "Rede Norte",
                    enabled: false,
                    effectiveEnabled: false,
                    inheritedFromGlobal: false,
                    propagationStatus: "PARCIAL",
                    unidadesPropagadas: 1,
                    totalUnidades: 2,
                  },
                ],
              },
            ],
            updatedAt: "2026-03-27T10:30:00",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      const matrix = await getFeatureFlagsMatrixApi();
      expect(calls).toHaveLength(1);
      expect(calls[0].url).toContain("/api/v1/admin/configuracoes/feature-flags/matrix");
      expect(matrix).toEqual({
        academias: [
          {
            academiaId: "academia-norte",
            academiaNome: "Rede Norte",
            totalUnits: 2,
            activeUnits: 1,
          },
        ],
        features: [
          {
            featureKey: "feature.financeiro",
            featureLabel: "Gestão financeira",
            moduleLabel: "Financeiro",
            description: undefined,
            globalEnabled: true,
            globalSource: "GLOBAL",
            academias: [
              {
                academiaId: "academia-norte",
                academiaNome: "Rede Norte",
                enabled: false,
                effectiveEnabled: false,
                inheritedFromGlobal: false,
                propagationStatus: "PARCIAL",
                propagatedUnits: 1,
                totalUnits: 2,
              },
            ],
          },
        ],
        updatedAt: "2026-03-27T10:30:00",
      });
    } finally {
      restore();
    }
  });

  test("toggleFeatureForAcademiaApi envia patch global e retorna matriz normalizada", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          academias: [
            {
              academiaId: "academia-norte",
              academiaNome: "Rede Norte",
              totalUnits: 2,
              activeUnits: 2,
            },
          ],
          features: [
            {
              featureKey: "feature.financeiro",
              featureLabel: "Gestão financeira",
              moduleLabel: "Financeiro",
              globalEnabled: false,
              globalSource: "GLOBAL",
              academias: [
                {
                  academiaId: "academia-norte",
                  academiaNome: "Rede Norte",
                  enabled: false,
                  effectiveEnabled: false,
                  inheritedFromGlobal: true,
                  propagationStatus: "TOTAL",
                  propagatedUnits: 2,
                  totalUnits: 2,
                },
              ],
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      const matrix = await toggleFeatureForAcademiaApi({
        featureKey: "feature.financeiro",
        enabled: false,
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("PATCH");
      expect(calls[0].url).toContain("/api/v1/admin/configuracoes/feature-flags/feature.financeiro/global");
      expect(JSON.parse(calls[0].body ?? "{}")).toEqual({ enabled: false });
      expect(matrix.features[0]?.globalEnabled).toBeFalsy();
    } finally {
      restore();
    }
  });
});
