import { expect, test } from "@playwright/test";
import {
  ajustarPagamentoService,
  createRecebimentoAvulsoService,
  importarPagamentosEmLoteService,
  listContasReceberOperacionais,
} from "../../src/lib/financeiro/recebimentos";

const envSnapshot = {
  devAutoLogin: process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN,
};

test.beforeEach(() => {
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
});

test.afterEach(() => {
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = envSnapshot.devAutoLogin;
});

function mockFetchSequence(
  responses: Array<{
    body: unknown;
    status?: number;
  }>
) {
  const calls: Array<{ url: string; method: string; body?: string | null }> = [];
  const previousFetch = global.fetch;

  global.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const next = responses[calls.length];
    if (!next) {
      throw new Error(`Unexpected fetch ${String(input)}`);
    }

    calls.push({
      url: String(input),
      method: init?.method ?? "GET",
      body: init?.body ? String(init.body) : null,
    });

    return Promise.resolve(
      new Response(JSON.stringify(next.body), {
        status: next.status ?? 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  }) as typeof global.fetch;

  return {
    calls,
    restore() {
      global.fetch = previousFetch;
    },
  };
}

const alunosPayload = {
  items: [
    {
      id: "al-1",
      tenantId: "tenant-1",
      nome: "Maria Souza",
      cpf: "11987654321",
      status: "ATIVO",
    },
  ],
};

test.describe("financeiro recebimentos service", () => {
  test("cria recebimento avulso pago e lista operacionais enriquecidos", async () => {
    const { calls, restore } = mockFetchSequence([
      { body: alunosPayload },
      {
        body: {
          id: "cr-1",
          tenantId: "tenant-1",
          cliente: "Maria Souza",
          documentoCliente: "11987654321",
          descricao: "Avaliação física premium",
          categoria: "SERVICO",
          competencia: "2026-03-01",
          dataEmissao: "2026-03-12",
          dataVencimento: "2026-03-12",
          valorOriginal: 89.9,
          desconto: 0,
          jurosMulta: 0,
          status: "PENDENTE",
          dataCriacao: "2026-03-12T10:00:00",
        },
        status: 201,
      },
      {
        body: {
          id: "cr-1",
          tenantId: "tenant-1",
          cliente: "Maria Souza",
          documentoCliente: "11987654321",
          descricao: "Avaliação física premium",
          categoria: "SERVICO",
          competencia: "2026-03-01",
          dataEmissao: "2026-03-12",
          dataVencimento: "2026-03-12",
          dataRecebimento: "2026-03-12",
          valorOriginal: 89.9,
          desconto: 0,
          jurosMulta: 0,
          formaPagamento: "PIX",
          status: "RECEBIDA",
          dataCriacao: "2026-03-12T10:00:00",
        },
      },
      { body: alunosPayload },
      {
        body: [
          {
            id: "cr-1",
            tenantId: "tenant-1",
            cliente: "Maria Souza",
            documentoCliente: "11987654321",
            descricao: "Avaliação física premium",
            categoria: "SERVICO",
            competencia: "2026-03-01",
            dataEmissao: "2026-03-12",
            dataVencimento: "2026-03-12",
            dataRecebimento: "2026-03-12",
            valorOriginal: 89.9,
            desconto: 0,
            jurosMulta: 0,
            formaPagamento: "PIX",
            status: "RECEBIDA",
            dataCriacao: "2026-03-12T10:00:00",
            nfseEmitida: true,
            nfseNumero: "NFS-CR-1",
          },
        ],
      },
      { body: alunosPayload },
    ]);

    try {
      const created = await createRecebimentoAvulsoService({
        tenantId: "tenant-1",
        data: {
          clienteNome: "Maria Souza",
          documentoCliente: "11987654321",
          descricao: "Avaliação física premium",
          valor: 89.9,
          dataVencimento: "2026-03-12",
          status: "PAGO",
          formaPagamento: "PIX",
        },
      });

      expect(created.status).toBe("PAGO");
      expect(created.alunoId).toBe("al-1");

      const rows = await listContasReceberOperacionais({
        tenantId: "tenant-1",
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].aluno?.nome).toBe("Maria Souza");
      expect(rows[0].nfseNumero).toBe("NFS-CR-1");

      expect(calls[0].url).toContain("/api/v1/comercial/alunos");
      expect(calls[1].url).toContain("/api/v1/gerencial/financeiro/contas-receber");
      expect(calls[2].url).toContain("/api/v1/gerencial/financeiro/contas-receber/cr-1/receber");
    } finally {
      restore();
    }
  });

  test("importa lote e ajusta pagamento existente", async () => {
    const { calls, restore } = mockFetchSequence([
      { body: alunosPayload },
      {
        body: {
          id: "cr-2",
          tenantId: "tenant-1",
          cliente: "Cliente Avulso",
          descricao: "Taxa avulsa",
          categoria: "AVULSO",
          competencia: "2026-03-01",
          dataVencimento: "2026-03-20",
          valorOriginal: 50,
          desconto: 0,
          jurosMulta: 0,
          status: "PENDENTE",
          dataCriacao: "2026-03-12T10:00:00",
        },
        status: 201,
      },
      { body: alunosPayload },
      {
        body: [
          {
            id: "cr-2",
            tenantId: "tenant-1",
            cliente: "Cliente Avulso",
            descricao: "Taxa avulsa",
            categoria: "AVULSO",
            competencia: "2026-03-01",
            dataVencimento: "2026-03-20",
            valorOriginal: 50,
            desconto: 0,
            jurosMulta: 0,
            status: "PENDENTE",
            dataCriacao: "2026-03-12T10:00:00",
          },
        ],
      },
      {
        body: {
          id: "cr-2",
          tenantId: "tenant-1",
          cliente: "Cliente Avulso",
          descricao: "Taxa avulsa ajustada",
          categoria: "AVULSO",
          competencia: "2026-03-01",
          dataVencimento: "2026-03-21",
          valorOriginal: 55,
          desconto: 5,
          jurosMulta: 0,
          status: "PENDENTE",
          dataCriacao: "2026-03-12T10:00:00",
        },
      },
      {
        body: {
          id: "cr-2",
          tenantId: "tenant-1",
          cliente: "Cliente Avulso",
          descricao: "Taxa avulsa ajustada",
          categoria: "AVULSO",
          competencia: "2026-03-01",
          dataVencimento: "2026-03-21",
          dataRecebimento: "2026-03-21",
          valorOriginal: 55,
          desconto: 5,
          jurosMulta: 0,
          formaPagamento: "PIX",
          status: "RECEBIDA",
          dataCriacao: "2026-03-12T10:00:00",
        },
      },
      { body: alunosPayload },
    ]);

    try {
      const resultado = await importarPagamentosEmLoteService({
        tenantId: "tenant-1",
        items: [
          {
            clienteNome: "Cliente Avulso",
            descricao: "Taxa avulsa",
            valor: 50,
            dataVencimento: "2026-03-20",
          },
        ],
      });

      expect(resultado.importados).toBe(1);
      expect(resultado.ignorados).toBe(0);

      const ajustado = await ajustarPagamentoService({
        tenantId: "tenant-1",
        id: "cr-2",
        data: {
          descricao: "Taxa avulsa ajustada",
          valor: 55,
          desconto: 5,
          dataVencimento: "2026-03-21",
          status: "PAGO",
          dataPagamento: "2026-03-21",
          formaPagamento: "PIX",
        },
      });

      expect(ajustado.status).toBe("PAGO");
      expect(ajustado.valorFinal).toBe(50);
      expect(calls.some((call) => call.url.includes("/api/v1/gerencial/financeiro/contas-receber/cr-2"))).toBeTruthy();
    } finally {
      restore();
    }
  });
});
