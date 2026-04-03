import { expect, test } from "@playwright/test";
import {
  getFeatureFlagsMatrixApi,
  getGlobalConfigApi,
  getIntegrationStatusApi,
  toggleFeatureForAcademiaApi,
  updateGlobalConfigApi,
} from "../../src/backoffice/api/admin-config";
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

  test("getIntegrationStatusApi normaliza a saúde das integrações globais", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          items: [
            {
              key: "PAYMENTS",
              name: "Gateway PIX/Boleto",
              provider: "Pagar.me",
              status: "ONLINE",
              uptime: 99.82,
              latencyMs: 128,
              filaPendente: 2,
              ultimaVerificacaoEm: "2026-03-27T12:30:00",
              ultimaSucessoEm: "2026-03-27T12:29:30",
              ultimoErro: "",
              documentationUrl: "https://docs.qa.local/payments",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      const integrations = await getIntegrationStatusApi();
      expect(calls).toHaveLength(1);
      expect(calls[0].url).toContain("/api/v1/admin/configuracoes/integracoes/status");
      expect(integrations).toEqual([
        {
          integrationKey: "PAYMENTS",
          integrationName: "Gateway PIX/Boleto",
          providerLabel: "Pagar.me",
          status: "ONLINE",
          uptimePercent: 99.82,
          avgLatencyMs: 128,
          pendingCount: 2,
          lastCheckAt: "2026-03-27T12:30:00",
          lastSuccessAt: "2026-03-27T12:29:30",
          lastErrorMessage: undefined,
          lastErrorAt: undefined,
          docsHref: "https://docs.qa.local/payments",
        },
      ]);
    } finally {
      restore();
    }
  });

  test("getGlobalConfigApi normaliza templates, termos e limites", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          templates: [
            {
              key: "boas-vindas",
              name: "Boas-vindas",
              subject: "Bem-vindo",
              channel: "EMAIL",
              enabled: true,
              html: "<p>Olá {{NOME}}</p>",
              variaveis: ["{{NOME}}"],
            },
          ],
          termosUsoHtml: "<p>Termos atualizados</p>",
          versaoTermos: "v2026.03",
          limitesApi: {
            rpm: 180,
            burst: 260,
            webhookRpm: 120,
            adminRpm: 80,
          },
          updatedAt: "2026-03-27T12:00:00",
          updatedBy: "Root Admin",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      const config = await getGlobalConfigApi();
      expect(calls).toHaveLength(1);
      expect(calls[0].url).toContain("/api/v1/admin/configuracoes/global");
      expect(config).toEqual({
        emailTemplates: [
          {
            id: "boas-vindas-1",
            slug: "boas-vindas",
            nome: "Boas-vindas",
            assunto: "Bem-vindo",
            canal: "EMAIL",
            ativo: true,
            bodyHtml: "<p>Olá {{NOME}}</p>",
            variables: ["{{NOME}}"],
            updatedAt: undefined,
          },
        ],
        termsOfUseHtml: "<p>Termos atualizados</p>",
        termsVersion: "v2026.03",
        termsUpdatedAt: undefined,
        apiLimits: {
          requestsPerMinute: 180,
          burstLimit: 260,
          webhookRequestsPerMinute: 120,
          adminRequestsPerMinute: 80,
        },
        updatedAt: "2026-03-27T12:00:00",
        updatedBy: "Root Admin",
      });
    } finally {
      restore();
    }
  });

  test("updateGlobalConfigApi envia put com payload consolidado", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          emailTemplates: [
            {
              id: "template-1",
              slug: "boas-vindas",
              nome: "Boas-vindas",
              assunto: "Assunto atualizado",
              canal: "EMAIL",
              ativo: true,
              bodyHtml: "<p>Olá {{NOME}}</p>",
              variables: ["{{NOME}}"],
            },
          ],
          termsOfUseHtml: "<p>Termos atualizados</p>",
          termsVersion: "v2026.03",
          apiLimits: {
            requestsPerMinute: 200,
            burstLimit: 300,
            webhookRequestsPerMinute: 140,
            adminRequestsPerMinute: 90,
          },
          updatedAt: "2026-03-27T13:00:00",
          updatedBy: "Root Admin",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      const config = await updateGlobalConfigApi({
        emailTemplates: [
          {
            id: "template-1",
            slug: "boas-vindas",
            nome: "Boas-vindas",
            assunto: "Assunto atualizado",
            canal: "EMAIL",
            ativo: true,
            bodyHtml: "<p>Olá {{NOME}}</p>",
            variables: ["{{NOME}}"],
          },
        ],
        termsOfUseHtml: "<p>Termos atualizados</p>",
        termsVersion: "v2026.03",
        apiLimits: {
          requestsPerMinute: 200,
          burstLimit: 300,
          webhookRequestsPerMinute: 140,
          adminRequestsPerMinute: 90,
        },
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("PUT");
      expect(calls[0].url).toContain("/api/v1/admin/configuracoes/global");
      expect(JSON.parse(calls[0].body ?? "{}")).toEqual({
        emailTemplates: [
          {
            id: "template-1",
            slug: "boas-vindas",
            nome: "Boas-vindas",
            assunto: "Assunto atualizado",
            canal: "EMAIL",
            ativo: true,
            bodyHtml: "<p>Olá {{NOME}}</p>",
            variables: ["{{NOME}}"],
          },
        ],
        termsOfUseHtml: "<p>Termos atualizados</p>",
        termsVersion: "v2026.03",
        apiLimits: {
          requestsPerMinute: 200,
          burstLimit: 300,
          webhookRequestsPerMinute: 140,
          adminRequestsPerMinute: 90,
        },
      });
      expect(config.updatedBy).toBe("Root Admin");
      expect(config.apiLimits.adminRequestsPerMinute).toBe(90);
    } finally {
      restore();
    }
  });
});
