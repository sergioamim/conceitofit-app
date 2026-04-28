import { expect, test } from "@playwright/test";
import { createAtividadeApi } from "../../src/lib/api/administrativo";
import {
  createPlanoApi,
  listPlanosApi,
} from "../../src/lib/api/comercial-catalogo";
import { createProspectApi } from "../../src/lib/api/crm";
import {
  buildPlanoPayload,
  getDefaultPlanoFormValues,
  isPlanoFormValid,
} from "../../src/lib/tenant/planos/form";
import { createFormaPagamentoApi } from "../../src/lib/api/formas-pagamento";
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
    activeTenantId: "tenant-guide",
    availableTenants: [{ tenantId: "tenant-guide", defaultTenant: true }],
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

test.describe("integration guide contracts", () => {
  test("createProspectApi envia payload do guia e preserva campos locais fora do contrato", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          id: "prospect-1",
          tenantId: "tenant-guide",
          nome: "Ana Maria",
          telefone: "(11) 99999-0000",
          email: "ana@example.com",
          cpf: "123.456.789-00",
          origem: "INSTAGRAM",
          status: "NOVO",
          observacoes: "Lead quente",
          dataCriacao: "2026-03-10T10:00:00",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      const created = await createProspectApi({
        tenantId: "tenant-guide",
        data: {
          nome: "  Ana Maria  ",
          telefone: " (11) 99999-0000 ",
          email: " ana@example.com ",
          cpf: " 123.456.789-00 ",
          origem: "INSTAGRAM",
          observacoes: " Lead quente ",
          responsavelId: "func-1",
        },
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].url).toContain("/api/v1/academia/prospects");
      expect(calls[0].url).toContain("tenantId=tenant-guide");
      expect(JSON.parse(calls[0].body ?? "{}")).toEqual({
        tenantId: "tenant-guide",
        nome: "Ana Maria",
        telefone: "(11) 99999-0000",
        email: "ana@example.com",
        cpf: "123.456.789-00",
        origem: "INSTAGRAM",
        observacoes: "Lead quente",
      });
      expect(created.responsavelId).toBe("func-1");
    } finally {
      restore();
    }
  });

  test("listPlanosApi normaliza DTO oficial para o shape local", async () => {
    const { restore } = mockFetchSequence([
      new Response(
        JSON.stringify([
          {
            id: "plano-1",
            tenantId: "tenant-guide",
            nome: "Mensal",
            tipo: "MENSAL",
            duracaoDias: "30",
            valor: "129.90",
            valorMatricula: "15.00",
            atividades: [{ id: "atividade-1" }],
            beneficios: ["Acesso livre", "Avaliação"],
            ativo: "true",
            destaque: 1,
            ordem: "2",
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      const planos = await listPlanosApi({ tenantId: "tenant-guide" });

      expect(planos).toHaveLength(1);
      expect(planos[0]).toMatchObject({
        id: "plano-1",
        tenantId: "tenant-guide",
        atividades: ["atividade-1"],
        beneficios: ["Acesso livre", "Avaliação"],
        valor: 129.9,
        valorMatricula: 15,
        destaque: true,
        ativo: true,
        permiteVendaOnline: true,
        permiteRenovacaoAutomatica: true,
        permiteCobrancaRecorrente: false,
        contratoAssinatura: "AMBAS",
      });
    } finally {
      restore();
    }
  });

  test("createPlanoApi envia apenas o contrato oficial do plano", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          id: "plano-1",
          tenantId: "tenant-guide",
          nome: "Mensal Premium",
          tipo: "MENSAL",
          duracaoDias: 30,
          valor: 149.9,
          valorMatricula: 10,
          atividadeIds: ["atividade-1"],
          beneficios: ["Spa"],
          destaque: true,
          ativo: true,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      await createPlanoApi({
        tenantId: "tenant-guide",
        data: {
          nome: "  Mensal Premium  ",
          descricao: "  Plano principal  ",
          tipo: "MENSAL",
          duracaoDias: 30,
          valor: 149.9,
          valorMatricula: 10,
          cobraAnuidade: true,
          valorAnuidade: 120,
          parcelasMaxAnuidade: 12,
          permiteRenovacaoAutomatica: true,
          permiteCobrancaRecorrente: true,
          diaCobrancaPadrao: [5],
          contratoTemplateHtml: "<p>Contrato</p>",
          contratoAssinatura: "AMBAS",
          contratoEnviarAutomaticoEmail: true,
          atividades: ["atividade-1"],
          beneficios: ["Spa"],
          destaque: true,
          permiteVendaOnline: true,
          ordem: 4,
        },
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].url).toContain("/api/v1/comercial/planos");
      expect(JSON.parse(calls[0].body ?? "{}")).toEqual({
        nome: "Mensal Premium",
        descricao: "Plano principal",
        tipo: "MENSAL",
        duracaoDias: 30,
        valor: 149.9,
        valorMatricula: 10,
        atividades: ["atividade-1"],
        beneficios: ["Spa"],
        destaque: true,
        permiteVendaOnline: true,
        ordem: 4,
      });
    } finally {
      restore();
    }
  });

  test("createAtividadeApi envia o payload atual da API de atividades", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          id: "atividade-1",
          tenantId: "tenant-guide",
          nome: "Yoga",
          descricao: "Alongamento e mobilidade",
          categoria: "COLETIVA",
          icone: "lotus",
          cor: "#22cc88",
          permiteCheckin: false,
          checkinObrigatorio: false,
          ativo: true,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      const created = await createAtividadeApi({
        tenantId: "tenant-guide",
        data: {
          nome: "  Yoga  ",
          descricao: "  Alongamento e mobilidade  ",
          categoria: "COLETIVA",
          icone: "lotus",
          cor: "#22cc88",
          permiteCheckin: false,
          checkinObrigatorio: false,
        },
      });

      expect(created).toMatchObject({
        id: "atividade-1",
        tenantId: "tenant-guide",
        nome: "Yoga",
        descricao: "Alongamento e mobilidade",
        categoria: "COLETIVA",
        icone: "lotus",
        cor: "#22cc88",
        permiteCheckin: false,
        checkinObrigatorio: false,
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].url).toContain("/api/v1/administrativo/atividades");
      expect(JSON.parse(calls[0].body ?? "{}")).toEqual({
        nome: "Yoga",
        descricao: "Alongamento e mobilidade",
        categoria: "COLETIVA",
        icone: "lotus",
        cor: "#22cc88",
        permiteCheckin: false,
        checkinObrigatorio: false,
      });
    } finally {
      restore();
    }
  });

  test("createFormaPagamentoApi usa o endpoint do guia e mantem extras locais fora do contrato oficial", async () => {
    const { calls, restore } = mockFetchSequence([
      new Response(
        JSON.stringify({
          id: "fp-1",
          tenantId: "tenant-guide",
          nome: "PIX",
          tipo: "PIX",
          taxaPercentual: 0,
          parcelasMax: 1,
          instrucoes: "Pagar no caixa",
          ativo: true,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      ),
    ]);

    try {
      const created = await createFormaPagamentoApi({
        tenantId: "tenant-guide",
        data: {
          nome: "PIX",
          tipo: "PIX",
          taxaPercentual: 0,
          parcelasMax: 1,
          instrucoes: "Pagar no caixa",
          emitirAutomaticamente: true,
          prazoRecebimentoDias: 0,
        },
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toContain("/api/v1/gerencial/financeiro/formas-pagamento");
      expect(JSON.parse(calls[0].body ?? "{}")).toEqual({
        tenantId: "tenant-guide",
        nome: "PIX",
        tipo: "PIX",
        taxaPercentual: 0,
        parcelasMax: 1,
        instrucoes: "Pagar no caixa",
      });
      expect(created.emitirAutomaticamente).toBe(true);
      expect(created.prazoRecebimentoDias).toBe(0);
    } finally {
      restore();
    }
  });

  test("plano form helpers aplicam as validacoes minimas do guia", () => {
    const invalid = {
      ...getDefaultPlanoFormValues(),
      nome: "A",
      valor: "0",
      duracaoDias: "0",
    };

    expect(isPlanoFormValid(invalid)).toBe(false);

    const payload = buildPlanoPayload({
      ...getDefaultPlanoFormValues(),
      nome: "  Mensal Fit  ",
      descricao: "  Plano base  ",
      valor: "149.90",
      valorMatricula: "19.90",
      duracaoDias: "30",
      beneficios: [" sauna ", " "],
      ordem: "-3",
    });

    expect(payload).toMatchObject({
      nome: "Mensal Fit",
      descricao: "Plano base",
      valor: 149.9,
      valorMatricula: 19.9,
      duracaoDias: 30,
      beneficios: ["sauna"],
      ordem: 0,
    });
    expect(isPlanoFormValid({
      ...getDefaultPlanoFormValues(),
      nome: "Mensal Fit",
      valor: "149.90",
      duracaoDias: "30",
    })).toBe(true);
  });
});
