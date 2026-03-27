import { expect, test } from "@playwright/test";
import {
  executarSolicitacaoExclusao,
  getComplianceDashboard,
  rejeitarSolicitacaoExclusao,
} from "../../src/lib/api/admin-compliance";
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
  body?: string;
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

function mockFetchSequence(
  responses: Response[]
): {
  calls: FetchCall[];
  restore(): void;
} {
  const calls: FetchCall[] = [];
  const previousFetch = global.fetch;

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      method: init?.method ?? "GET",
      body: typeof init?.body === "string" ? init.body : undefined,
    });

    const response = responses[calls.length - 1];
    if (!response) {
      throw new Error(`Unexpected fetch call ${calls.length}`);
    }
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

test.describe("admin compliance api", () => {
  test("normaliza o dashboard por academia e computa exposição sensível", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          dashboard: {
            academias: [
              {
                academiaId: "acd-1",
                nome: "Rede Norte",
                alunos: 40,
                totalCpf: 38,
                totalEmail: 39,
                totalTelefone: 30,
                aceitesTermos: 35,
                pendenciasTermos: 5,
                camposColetados: ["cpf", "email"],
              },
            ],
            solicitacoesExclusao: [
              {
                requestId: "req-1",
                academiaId: "acd-1",
                academia: "Rede Norte",
                nomeAluno: "Ana Souza",
                createdAt: "2026-03-27T12:00:00",
                requestedBy: "dpo@rede.local",
                status: "PENDENTE",
              },
            ],
            termosAceitos: 35,
            termosPendentes: 5,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      const dashboard = await getComplianceDashboard();

      expect(calls).toHaveLength(1);
      expect(calls[0]?.url).toContain("/api/v1/admin/compliance/dashboard");
      expect(dashboard.totalDadosPessoaisArmazenados).toBe(107);
      expect(dashboard.solicitacoesExclusaoPendentes).toBe(1);
      expect(dashboard.academias[0]).toEqual(
        expect.objectContaining({
          academiaId: "acd-1",
          academiaNome: "Rede Norte",
          alunosComCpf: 38,
          alunosComEmail: 39,
          alunosComTelefone: 30,
          termosAceitos: 35,
          termosPendentes: 5,
          statusTermos: "PARCIAL",
          ultimaSolicitacaoExclusao: "2026-03-27T12:00:00",
        })
      );
      expect(dashboard.exposicaoCamposSensiveis).toEqual([
        {
          key: "cpf",
          label: "CPF",
          totalAcademias: 1,
          academias: ["Rede Norte"],
        },
        {
          key: "email",
          label: "E-mail",
          totalAcademias: 1,
          academias: ["Rede Norte"],
        },
      ]);
    } finally {
      restore();
    }
  });

  test("processa ações de executar e rejeitar solicitação", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(null, { status: 204 }),
      new Response(null, { status: 204 }),
    ]);

    try {
      await executarSolicitacaoExclusao("req-10");
      await rejeitarSolicitacaoExclusao("req-11");

      expect(calls).toHaveLength(2);
      expect(calls[0]).toEqual(
        expect.objectContaining({
          method: "POST",
          url: expect.stringContaining("/api/v1/admin/compliance/solicitacoes-exclusao/req-10/executar"),
        })
      );
      expect(calls[1]).toEqual(
        expect.objectContaining({
          method: "POST",
          url: expect.stringContaining("/api/v1/admin/compliance/solicitacoes-exclusao/req-11/rejeitar"),
        })
      );
    } finally {
      restore();
    }
  });
});
