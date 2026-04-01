import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { listMatriculasApi, listMatriculasDashboardMensalApi } from "../../src/lib/api/matriculas";
import { apiRequest } from "../../src/lib/api/http";
import {
  clearAuthSession,
  CONTEXT_STORAGE_KEY,
  getActiveTenantIdFromSession,
  getAvailableTenantsFromSession,
  getAccessToken,
  getRefreshToken,
  hasActiveSession,
  saveAuthSession,
  setPreferredTenantId,
} from "../../src/lib/api/session";
import { listAlunosPageService } from "../../src/lib/tenant/comercial/runtime";

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
  credentials?: RequestCredentials;
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
      credentials: init?.credentials,
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
  test("mantém tokens apenas em memória e usa flag de sessão ativa no navegador", async () => {
    saveAuthSession({
      token: "access-token",
      refreshToken: "refresh-token",
      type: "Bearer",
      userId: "user-1",
      displayName: "Usuário Teste",
    });

    expect(getAccessToken()).toBe("access-token");
    expect(getRefreshToken()).toBe("refresh-token");
    expect(hasActiveSession()).toBeTruthy();
    expect(window.localStorage.getItem("academia-auth-token")).toBeNull();
    expect(window.localStorage.getItem("academia-auth-refresh-token")).toBeNull();
    expect(window.localStorage.getItem("academia-auth-session-active")).toBe("true");
  });

  test("select trigger não usa suppressHydrationWarning", () => {
    const source = readFileSync(`${process.cwd()}/src/components/ui/select.tsx`, "utf8");
    expect(source).not.toMatch(/suppressHydrationWarning/);
  });

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
      expect(calls[0].credentials).toBe("include");
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

  test("remove tenantId redundante em rotas administrativas auditadas e preserva contexto opaco", async () => {
    saveAuthSession({
      token: "access-token",
      refreshToken: "refresh-token",
      activeTenantId: "tenant-active",
      availableTenants: [{ tenantId: "tenant-active", defaultTenant: true }],
    });

    const { calls, restore } = mockFetchSequence([
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    try {
      await apiRequest<unknown>({
        path: "/api/v1/administrativo/cargos",
        query: {
          tenantId: "tenant-secondary",
          page: 1,
        },
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toContain("/api/v1/administrativo/cargos");
      expect(calls[0].url).not.toContain("tenantId=");
      expect(calls[0].url).toContain("page=1");
      expect(calls[0].headers.get("X-Context-Id")).toBeTruthy();
      expect(calls[0].headers.get("X-Context-Id")).not.toBe("tenant-active");
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

  test("listAlunosPageService consome o envelope canônico em response.items", async () => {
    saveAuthSession({
      token: "access-token",
      refreshToken: "refresh-token",
      activeTenantId: "tenant-clientes",
      availableTenants: [{ tenantId: "tenant-clientes", defaultTenant: true }],
    });

    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          items: [
            {
              id: "aluno-1",
              tenantId: "tenant-clientes",
              nome: "Ana Envelope",
              email: "ana@academia.local",
              telefone: "(11) 99999-0000",
              cpf: "123.456.789-00",
              dataNascimento: "1992-04-10",
              sexo: "F",
              status: "ATIVO",
              pendenteComplementacao: false,
              dataCadastro: "2026-03-01T10:00:00",
            },
          ],
          page: 0,
          size: 20,
          hasNext: false,
          totaisStatus: {
            total: 7,
            ativos: 5,
            suspensos: 1,
            inativos: 1,
            cancelados: 0,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      ),
    ]);

    try {
      const result = await listAlunosPageService({
        tenantId: "tenant-clientes",
        page: 0,
        size: 20,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.nome).toBe("Ana Envelope");
      expect(result.total).toBe(7);
      expect(result.totaisStatus).toEqual(
        expect.objectContaining({
          total: 7,
          totalAtivo: 5,
          totalSuspenso: 1,
          totalInativo: 1,
          totalCancelado: 0,
        })
      );
      expect(calls).toHaveLength(1);
      expect(calls[0].url).toContain("/api/v1/comercial/alunos");
      expect(calls[0].url).toContain("envelope=true");
      expect(calls[0].url).not.toContain("tenantId=");
    } finally {
      restore();
    }
  });

  test("listMatriculasApi tenta /adesoes primeiro e faz fallback para /matriculas", async () => {
    saveAuthSession({
      token: "access-token",
      refreshToken: "refresh-token",
      activeTenantId: "tenant-comercial",
      availableTenants: [{ tenantId: "tenant-comercial", defaultTenant: true }],
    });

    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          status: 404,
          error: "Not Found",
          message: "Rota não disponível",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      ),
      new Response(
        JSON.stringify([
          {
            id: "adesao-1",
            tenantId: "tenant-comercial",
            alunoId: "aluno-1",
            planoId: "plano-1",
            dataInicio: "2026-03-01",
            dataFim: "2026-03-31",
            valorPago: 149.9,
            valorMatricula: 0,
            desconto: 0,
            formaPagamento: "PIX",
            status: "ATIVA",
            renovacaoAutomatica: false,
            dataCriacao: "2026-03-01T10:00:00",
            aluno: {
              id: "aluno-1",
              tenantId: "tenant-comercial",
              nome: "Cliente Adesão",
              email: "cliente@academia.local",
              telefone: "(11) 98888-0000",
              cpf: "123.456.789-00",
              dataNascimento: "1991-01-01",
              sexo: "F",
              status: "ATIVO",
              dataCadastro: "2026-03-01T09:00:00",
            },
            plano: {
              id: "plano-1",
              nome: "Plano Gold",
              tipo: "MENSAL",
              duracaoDias: 30,
              valor: 149.9,
              valorMatricula: 0,
              destaque: false,
              ativo: true,
              permiteRenovacaoAutomatica: true,
              permiteCobrancaRecorrente: false,
              contratoAssinatura: "AMBAS",
              contratoEnviarAutomaticoEmail: false,
            },
          },
        ]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      ),
    ]);

    try {
      const result = await listMatriculasApi({
        tenantId: "tenant-comercial",
        status: "ATIVA",
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("adesao-1");
      expect(calls).toHaveLength(2);
      expect(calls[0].url).toContain("/api/v1/comercial/adesoes");
      expect(calls[1].url).toContain("/api/v1/comercial/matriculas");
      expect(calls[0].url).not.toContain("tenantId=");
      expect(calls[1].url).not.toContain("tenantId=");
      expect(calls[0].headers.get("Authorization")).toBe("Bearer access-token");
      expect(calls[0].headers.get("X-Context-Id")).toBeTruthy();
      expect(calls[1].headers.get("Authorization")).toBe("Bearer access-token");
      expect(calls[1].headers.get("X-Context-Id")).toBeTruthy();
    } finally {
      restore();
    }
  });

  test("listMatriculasDashboardMensalApi consome o endpoint mensal agregado com filtro por mes", async () => {
    saveAuthSession({
      token: "access-token",
      refreshToken: "refresh-token",
      activeTenantId: "tenant-comercial",
      availableTenants: [{ tenantId: "tenant-comercial", defaultTenant: true }],
    });

    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          mes: "2026-03",
          resumo: {
            totalContratos: 3,
            contratosAtivos: 2,
            percentualAtivos: 66.67,
            receitaContratada: 674.95,
            ticketMedio: 224.98,
            pendentesAssinatura: 1,
            insight: "1 contrato(s) aguardam assinatura neste mes.",
          },
          carteiraAtivaPorPlano: [
            {
              planoId: "plano-black",
              planoNome: "Black",
              quantidade: 2,
              valor: 609.9,
              percentual: 66.67,
            },
          ],
          contratos: {
            items: [
              {
                id: "mat-1",
                tenantId: "tenant-comercial",
                alunoId: "aluno-1",
                planoId: "plano-black",
                dataInicio: "2026-03-18",
                dataFim: "2027-03-18",
                valorPago: 299.9,
                valorMatricula: 0,
                desconto: 0,
                formaPagamento: "PIX",
                status: "ATIVA",
                renovacaoAutomatica: false,
                dataCriacao: "2026-03-18T14:30:00",
                contratoStatus: "ASSINADO",
                aluno: {
                  id: "aluno-1",
                  tenantId: "tenant-comercial",
                  nome: "Ana",
                  email: "ana@academia.local",
                  telefone: "(11) 99999-0000",
                  cpf: "123.456.789-00",
                  dataNascimento: "1990-01-01",
                  sexo: "F",
                  status: "ATIVO",
                  dataCadastro: "2026-03-01T09:00:00",
                },
                plano: {
                  id: "plano-black",
                  nome: "Black",
                  tipo: "MENSAL",
                  duracaoDias: 30,
                  valor: 299.9,
                  valorMatricula: 0,
                  destaque: false,
                  ativo: true,
                  permiteRenovacaoAutomatica: true,
                  permiteCobrancaRecorrente: false,
                  contratoAssinatura: "AMBAS",
                  contratoEnviarAutomaticoEmail: false,
                },
              },
            ],
            page: 0,
            size: 20,
            totalItems: 3,
            totalPages: 1,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      ),
    ]);

    try {
      const result = await listMatriculasDashboardMensalApi({
        tenantId: "tenant-comercial",
        mes: "2026-03",
        page: 0,
        size: 20,
      });

      expect(result.mes).toBe("2026-03");
      expect(result.resumo.ticketMedio).toBe(224.98);
      expect(result.resumo.pendentesAssinatura).toBe(1);
      expect(result.carteiraAtivaPorPlano[0]?.planoNome).toBe("Black");
      expect(result.contratos.items[0]?.aluno?.nome).toBe("Ana");
      expect(result.contratos.totalItems).toBe(3);
      expect(calls).toHaveLength(1);
      expect(calls[0].url).toContain("/api/v1/comercial/matriculas/dashboard-mensal");
      expect(calls[0].url).toContain("mes=2026-03");
      expect(calls[0].url).toContain("page=0");
      expect(calls[0].url).toContain("size=20");
      expect(calls[0].url).not.toContain("tenantId=");
      expect(calls[0].headers.get("X-Context-Id")).toBeTruthy();
    } finally {
      restore();
    }
  });

  test("sincroniza a unidade ativa e repete a rota operacional quando o backend responde sem contexto ativo", async () => {
    saveAuthSession({
      token: "access-token",
      refreshToken: "refresh-token",
      activeTenantId: "tenant-planos",
      availableTenants: [{ tenantId: "tenant-planos", defaultTenant: true }],
    });

    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          message: "X-Context-Id sem unidade ativa. Consulte /api/v1/context/unidade-ativa primeiro",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      ),
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
      new Response(JSON.stringify([{ id: "plano-1", nome: "Plano Gold" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    try {
      const response = await apiRequest<Array<{ id: string; nome: string }>>({
        path: "/api/v1/comercial/planos",
        query: {
          tenantId: "tenant-planos",
          apenasAtivos: false,
        },
      });

      expect(response).toEqual([{ id: "plano-1", nome: "Plano Gold" }]);
      expect(calls).toHaveLength(3);
      const initialContextId = calls[0].headers.get("X-Context-Id");
      expect(calls[0].url).toContain("/api/v1/comercial/planos");
      expect(calls[0].url).not.toContain("tenantId=");
      expect(initialContextId).toBeTruthy();
      expect(initialContextId).not.toBe("tenant-planos");
      expect(calls[1].url).toContain("/api/v1/context/unidade-ativa/tenant-planos");
      expect(calls[1].method).toBe("PUT");
      expect(calls[1].headers.get("X-Context-Id")).toBe(initialContextId);
      expect(calls[2].url).toContain("/api/v1/comercial/planos");
      expect(calls[2].url).not.toContain("tenantId=");
      expect(calls[2].headers.get("X-Context-Id")).toBe(initialContextId);
      expect(getActiveTenantIdFromSession()).toBe("tenant-planos");
    } finally {
      restore();
    }
  });

  test("sincroniza o tenant explicito e atualiza o X-Context-Id antes do retry", async () => {
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
      new Response(
        JSON.stringify({
          message: "tenantId diverge da unidade ativa do contexto informado",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      ),
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
      new Response(JSON.stringify([{ id: "plano-2", nome: "Plano Pro" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    try {
      const response = await apiRequest<Array<{ id: string; nome: string }>>({
        path: "/api/v1/comercial/planos",
        query: {
          tenantId: "tenant-secondary",
          apenasAtivos: false,
        },
      });

      expect(response).toEqual([{ id: "plano-2", nome: "Plano Pro" }]);
      expect(calls).toHaveLength(3);
      const initialContextId = calls[0].headers.get("X-Context-Id");
      expect(initialContextId).toBeTruthy();
      expect(initialContextId).not.toBe("tenant-active");
      expect(calls[1].url).toContain("/api/v1/context/unidade-ativa/tenant-secondary");
      expect(calls[1].headers.get("X-Context-Id")).toBe(initialContextId);
      expect(calls[2].headers.get("X-Context-Id")).toBe(initialContextId);
      expect(getActiveTenantIdFromSession()).toBe("tenant-secondary");
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
      expect(calls[1].credentials).toBe("include");
      expect(calls[2].headers.get("Authorization")).toBe("Bearer token-fresh");
      expect(calls[2].credentials).toBe("include");
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

  test("limpa sessao completa quando refresh do token falha", async () => {
    saveAuthSession({
      token: "token-expired",
      refreshToken: "refresh-token",
      type: "Bearer",
      activeTenantId: "tenant-active",
      availableTenants: [{ tenantId: "tenant-active", defaultTenant: true }],
    });
    window.localStorage.setItem(CONTEXT_STORAGE_KEY, "ctx-stale");

    const { calls, restore } = mockFetchSequence([
      new Response(JSON.stringify({ message: "expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
      new Response(
        JSON.stringify({ message: "refresh failed" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      ),
    ]);

    try {
      await expect(async () =>
        apiRequest<{ ok: boolean }>({
          path: "/api/v1/administrativo/cargos",
        })
      ).rejects.toMatchObject({
        message: "expired",
        status: 401,
      });

      expect(calls).toHaveLength(2);
      expect(calls[0].headers.get("Authorization")).toBe("Bearer token-expired");
      expect(calls[1].url).toContain("/api/v1/auth/refresh");
      expect(calls[1].credentials).toBe("include");
      expect(getAccessToken()).toBeUndefined();
      expect(getRefreshToken()).toBeUndefined();
      expect(window.localStorage.getItem(CONTEXT_STORAGE_KEY)).toBeNull();
      expect(getActiveTenantIdFromSession()).toBeUndefined();
      expect(getAvailableTenantsFromSession()).toEqual([]);
    } finally {
      restore();
    }
  });

  test("limpa sessao completa quando refresh retorna ok e a requisicao reprocessada retorna 401", async () => {
    saveAuthSession({
      token: "token-expired",
      refreshToken: "refresh-token",
      type: "Bearer",
      activeTenantId: "tenant-active",
      availableTenants: [{ tenantId: "tenant-active", defaultTenant: true }],
    });
    window.localStorage.setItem(CONTEXT_STORAGE_KEY, "ctx-stale");

    const { calls, restore } = mockFetchSequence([
      new Response(JSON.stringify({ message: "expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
      new Response(JSON.stringify({ token: "token-fresh" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
      new Response(JSON.stringify({ message: "still unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    try {
      await expect(async () =>
        apiRequest<{ ok: boolean }>({
          path: "/api/v1/administrativo/cargos",
        })
      ).rejects.toMatchObject({
        message: "still unauthorized",
        status: 401,
      });

      expect(calls).toHaveLength(3);
      expect(calls[1].url).toContain("/api/v1/auth/refresh");
      expect(calls[1].credentials).toBe("include");
      expect(calls[2].headers.get("Authorization")).toBe("Bearer token-fresh");
      expect(window.localStorage.getItem(CONTEXT_STORAGE_KEY)).toBeNull();
      expect(getAccessToken()).toBeUndefined();
      expect(getRefreshToken()).toBeUndefined();
      expect(getActiveTenantIdFromSession()).toBeUndefined();
      expect(getAvailableTenantsFromSession()).toEqual([]);
    } finally {
      restore();
    }
  });

  test("tenta refresh via cookie mesmo sem refresh token em memória", async () => {
    saveAuthSession({
      token: "token-invalid",
      type: "Bearer",
      userId: "user-cookie",
      activeTenantId: "tenant-active",
      availableTenants: [{ tenantId: "tenant-active", defaultTenant: true }],
    });

    const { calls, restore } = mockFetchSequence([
      new Response(JSON.stringify({ message: "jwt malformed" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
      new Response(JSON.stringify({}), {
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
      expect(calls[1].url).toContain("/api/v1/auth/refresh");
      expect(calls[1].credentials).toBe("include");
      expect(calls[1].headers.get("Authorization")).toBeNull();
      expect(calls[2].headers.get("Authorization")).toBeNull();
      expect(hasActiveSession()).toBeTruthy();
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
