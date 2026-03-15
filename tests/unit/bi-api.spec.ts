import { expect, test } from "@playwright/test";
import { getBiOperacionalSnapshotApi } from "../../src/lib/api/bi";
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

function mockFetchWithSequence(responses: Array<unknown>) {
  const calls: Array<{ url: string; method: string }> = [];
  const previousFetch = global.fetch;

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const next = responses[calls.length];
    if (next === undefined) {
      throw new Error(`Unexpected fetch ${String(input)}`);
    }

    calls.push({
      url: String(input),
      method: init?.method ?? "GET",
    });

    return new Response(JSON.stringify(next), {
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

test.describe("bi api adapter", () => {
  test("agrega snapshot via endpoints reais e ignora reservas sem contrato", async () => {
    saveAuthSession({
      token: "access-token",
      refreshToken: "refresh-token",
      activeTenantId: "tn-1",
      availableTenants: [{ tenantId: "tn-1", defaultTenant: true }],
    });

    const { calls, restore } = mockFetchWithSequence([
      { id: "acd-1", nome: "Rede Fit", ativo: true },
      [{ id: "tn-1", academiaId: "acd-1", nome: "Unidade Centro", ativo: true }],
      [
        {
          id: "pr-1",
          tenantId: "tn-1",
          nome: "Ana",
          telefone: "11999999999",
          origem: "INSTAGRAM",
          status: "CONVERTIDO",
          dataCriacao: "2026-03-02T10:00:00",
          statusLog: [{ status: "CONVERTIDO", data: "2026-03-03T11:00:00" }],
        },
      ],
      {
        items: [
          {
            id: "al-1",
            tenantId: "tn-1",
            prospectId: "pr-1",
            nome: "Ana",
            email: "ana@email.com",
            telefone: "11999999999",
            cpf: "123.456.789-00",
            dataNascimento: "1990-01-01",
            sexo: "F",
            status: "ATIVO",
            dataCadastro: "2026-03-03T11:10:00",
          },
        ],
      },
      [
        {
          id: "mt-1",
          tenantId: "tn-1",
          alunoId: "al-1",
          planoId: "pl-1",
          dataInicio: "2026-03-03",
          dataFim: "2026-04-03",
          valorPago: 129.9,
          valorMatricula: 40,
          desconto: 0,
          formaPagamento: "PIX",
          status: "ATIVA",
          renovacaoAutomatica: true,
          dataCriacao: "2026-03-03T11:12:00",
        },
      ],
      [
        {
          id: "cr-1",
          tenantId: "tn-1",
          cliente: "Ana",
          documentoCliente: "12345678900",
          descricao: "Mensalidade Ana",
          categoria: "MENSALIDADE",
          competencia: "2026-03-01",
          valorOriginal: 129.9,
          desconto: 0,
          jurosMulta: 0,
          dataVencimento: "2026-03-03",
          dataRecebimento: "2026-03-03",
          valorRecebido: 129.9,
          formaPagamento: "PIX",
          status: "RECEBIDA",
          geradaAutomaticamente: false,
          dataCriacao: "2026-03-03T11:20:00",
        },
      ],
      {
        items: [
          {
            id: "al-1",
            tenantId: "tn-1",
            prospectId: "pr-1",
            nome: "Ana",
            email: "ana@email.com",
            telefone: "11999999999",
            cpf: "123.456.789-00",
            dataNascimento: "1990-01-01",
            sexo: "F",
            status: "ATIVO",
            dataCadastro: "2026-03-03T11:10:00",
          },
        ],
      },
      [],
      {
        items: [
          {
            id: "al-1",
            tenantId: "tn-1",
            prospectId: "pr-1",
            nome: "Ana",
            email: "ana@email.com",
            telefone: "11999999999",
            cpf: "123.456.789-00",
            dataNascimento: "1990-01-01",
            sexo: "F",
            status: "ATIVO",
            dataCadastro: "2026-03-03T11:10:00",
          },
        ],
      },
      [],
      {
        items: [
          {
            id: "al-1",
            tenantId: "tn-1",
            prospectId: "pr-1",
            nome: "Ana",
            email: "ana@email.com",
            telefone: "11999999999",
            cpf: "123.456.789-00",
            dataNascimento: "1990-01-01",
            sexo: "F",
            status: "ATIVO",
            dataCadastro: "2026-03-03T11:10:00",
          },
        ],
      },
      [
        {
          id: "gr-1",
          tenantId: "tn-1",
          atividadeId: "atv-1",
          diasSemana: ["SEG", "QUA"],
          definicaoHorario: "PREVIAMENTE",
          horaInicio: "08:00",
          horaFim: "09:00",
          capacidade: 10,
          checkinLiberadoMinutosAntes: 60,
          duracaoMinutos: 60,
          acessoClientes: "TODOS_CLIENTES",
          permiteReserva: true,
          limitarVagasAgregadores: false,
          exibirWellhub: false,
          permitirSaidaAntesInicio: true,
          permitirEscolherNumeroVaga: false,
          exibirNoAppCliente: true,
          exibirNoAutoatendimento: true,
          exibirNoWodTv: false,
          finalizarAtividadeAutomaticamente: true,
          desabilitarListaEspera: false,
          ativo: true,
        },
      ],
      [],
    ]);

    try {
      const snapshot = await getBiOperacionalSnapshotApi({
        scope: "ACADEMIA",
        academiaId: "acd-1",
        startDate: "2026-03-01",
        endDate: "2026-03-07",
        segmento: "TODOS",
        canViewNetwork: true,
      });

      expect(snapshot.scope).toBe("ACADEMIA");
      expect(snapshot.academiaNome).toBe("Rede Fit");
      expect(snapshot.kpis.receita).toBeCloseTo(129.9, 2);
      expect(snapshot.kpis.conversoes).toBe(1);
      expect(snapshot.benchmark).toHaveLength(1);
      expect(snapshot.benchmark[0]?.tenantNome).toBe("Unidade Centro");
      expect(snapshot.kpis.ocupacaoPct).toBe(0);

      expect(calls).toHaveLength(13);
      expect(calls.some((call) => call.url.includes("/api/v1/academia"))).toBeTruthy();
      expect(calls.some((call) => call.url.includes("/api/v1/unidades"))).toBeTruthy();
      expect(calls.some((call) => call.url.includes("/api/v1/academia/prospects") && call.url.includes("tenantId=tn-1"))).toBeTruthy();
      expect(calls.some((call) => call.url.includes("/api/v1/comercial/alunos") && !call.url.includes("tenantId="))).toBeTruthy();
      expect(calls.some((call) => call.url.includes("/api/v1/gerencial/financeiro/contas-receber") && call.url.includes("status=RECEBIDA"))).toBeTruthy();
      expect(calls.some((call) => call.url.includes("/api/v1/gerencial/financeiro/contas-receber") && call.url.includes("status=PENDENTE"))).toBeTruthy();
      expect(calls.some((call) => call.url.includes("/api/v1/gerencial/financeiro/contas-receber") && call.url.includes("status=VENCIDA"))).toBeTruthy();
      expect(calls.some((call) => call.url.includes("/api/v1/administrativo/atividades-grade") && !call.url.includes("tenantId="))).toBeTruthy();
      expect(calls.some((call) => call.url.includes("/api/v1/agenda/aulas/reservas") && !call.url.includes("tenantId="))).toBeTruthy();
    } finally {
      restore();
    }
  });
});
