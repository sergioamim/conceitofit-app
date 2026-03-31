import { expect, test } from "@playwright/test";
import {
  ajustarPagamentoService,
  createRecebimentoAvulsoService,
  importarPagamentosEmLoteService,
  listContasReceberOperacionais,
} from "../../src/lib/tenant/financeiro/recebimentos";

function mockFetchSequence(
  responses: Array<{
    body: unknown;
    status?: number;
  }>,
) {
  const previousFetch = global.fetch;
  const calls: Array<{ url: string; method: string; body?: string | null }> = [];

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
      }),
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

test.describe("financeiro recebimentos full", () => {
  test("lista contas operacionais mapeando status e vínculo do aluno por CPF", async () => {
    const { restore } = mockFetchSequence([
      {
        body: [
          {
            id: "cr-1",
            tenantId: "tenant-1",
            cliente: "Maria Souza",
            documentoCliente: "11987654321",
            descricao: "Mensalidade",
            categoria: "MENSALIDADE",
            competencia: "2026-03-01",
            dataVencimento: "2026-03-20",
            valorOriginal: 120,
            desconto: 20,
            jurosMulta: 10,
            status: "VENCIDA",
            dataCriacao: "2026-03-01T10:00:00",
          },
        ],
      },
      { body: alunosPayload },
    ]);

    try {
      const rows = await listContasReceberOperacionais({
        tenantId: "tenant-1",
        status: "VENCIDO",
      });

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        status: "VENCIDO",
        tipo: "MENSALIDADE",
        valor: 120,
        desconto: 20,
        valorFinal: 110,
        clienteNome: "Maria Souza",
      });
      expect(rows[0]?.aluno?.id).toBe("al-1");
    } finally {
      restore();
    }
  });

  test("cria recebimento avulso sem aluno identificado e retorna aluno manual", async () => {
    const { calls, restore } = mockFetchSequence([
      { body: { items: [] } },
      {
        body: {
          id: "cr-2",
          tenantId: "tenant-1",
          cliente: "Cliente Walk-in",
          documentoCliente: null,
          descricao: " Avaliação avulsa ",
          categoria: "AVULSO",
          competencia: "2026-03-01",
          dataEmissao: "2026-03-10",
          dataVencimento: "2026-03-10",
          valorOriginal: 80,
          desconto: 10,
          jurosMulta: 0,
          status: "PENDENTE",
          dataCriacao: "2026-03-10T10:00:00",
        },
        status: 201,
      },
      { body: { items: [] } },
    ]);

    try {
      const created = await createRecebimentoAvulsoService({
        tenantId: "tenant-1",
        data: {
          clienteNome: "Cliente Walk-in",
          descricao: " Avaliação avulsa ",
          valor: 80,
          desconto: 10,
          dataVencimento: "2026-03-10",
        },
      });

      expect(created.alunoId).toBe("manual-avulso-tenant-1");
      expect(created.status).toBe("PENDENTE");
      expect(calls[1]?.body).toContain('"descricao":"Avaliação avulsa"');
      expect(calls[1]?.body).toContain('"valorOriginal":80');
      expect(calls[1]?.body).toContain('"desconto":10');
    } finally {
      restore();
    }
  });

  test("cria recebimento pago com clamp de valor e competência mensal determinística", async () => {
    const { calls, restore } = mockFetchSequence([
      { body: alunosPayload },
      {
        body: {
          id: "cr-5",
          tenantId: "tenant-1",
          cliente: "Maria Souza",
          documentoCliente: "11987654321",
          descricao: "Serviço premium",
          categoria: "SERVICO",
          competencia: "2026-03-01",
          dataEmissao: "2026-03-10",
          dataVencimento: "2026-03-18",
          valorOriginal: 80,
          desconto: 120,
          jurosMulta: 0,
          status: "PENDENTE",
          dataCriacao: "2026-03-10T10:00:00",
        },
        status: 201,
      },
      {
        body: {
          id: "cr-5",
          tenantId: "tenant-1",
          cliente: "Maria Souza",
          documentoCliente: "11987654321",
          descricao: "Serviço premium",
          categoria: "SERVICO",
          competencia: "2026-03-01",
          dataEmissao: "2026-03-10",
          dataVencimento: "2026-03-18",
          dataRecebimento: "2026-03-18",
          valorOriginal: 80,
          desconto: 120,
          jurosMulta: 0,
          formaPagamento: "PIX",
          status: "RECEBIDA",
          dataCriacao: "2026-03-10T10:00:00",
        },
      },
      { body: alunosPayload },
    ]);

    try {
      const created = await createRecebimentoAvulsoService({
        tenantId: "tenant-1",
        data: {
          clienteNome: "Maria Souza",
          documentoCliente: "119.876.543-21",
          descricao: " Serviço premium ",
          valor: 80,
          desconto: 120,
          dataVencimento: "2026-03-18",
          status: "PAGO",
          dataPagamento: "2026-03-18",
          formaPagamento: "PIX",
        },
      });

      expect(created.status).toBe("PAGO");
      expect(created.valorFinal).toBe(0);
      expect(created.alunoId).toBe("al-1");
      expect(calls[1]?.body).toContain('"competencia":"2026-03-01"');
      expect(calls[2]?.body).toContain('"valorRecebido":0');
    } finally {
      restore();
    }
  });

  test("importa lote parcialmente e agrega erros de validação", async () => {
    const { restore } = mockFetchSequence([
      { body: alunosPayload },
      {
        body: {
          id: "cr-3",
          tenantId: "tenant-1",
          cliente: "Maria Souza",
          documentoCliente: "11987654321",
          descricao: "Taxa válida",
          categoria: "AVULSO",
          competencia: "2026-03-01",
          dataEmissao: "2026-03-12",
          dataVencimento: "2026-03-12",
          valorOriginal: 50,
          desconto: 0,
          jurosMulta: 0,
          status: "PENDENTE",
          dataCriacao: "2026-03-12T10:00:00",
        },
        status: 201,
      },
      { body: alunosPayload },
    ]);

    try {
      const result = await importarPagamentosEmLoteService({
        tenantId: "tenant-1",
        items: [
          {
            clienteNome: "Maria Souza",
            descricao: "Taxa válida",
            valor: 50,
            dataVencimento: "2026-03-12",
          },
          {
            clienteNome: "Sem valor",
            descricao: "Inválido",
            valor: 0,
            dataVencimento: "2026-03-12",
          },
          {
            clienteNome: "Sem data",
            descricao: "Inválido 2",
            valor: 10,
            dataVencimento: "12/03/2026",
          },
        ],
      });

      expect(result).toMatchObject({
        total: 3,
        importados: 1,
        ignorados: 2,
      });
      expect(result.erros).toEqual(
        expect.arrayContaining([
          expect.stringContaining("valor deve ser maior que zero"),
          expect.stringContaining("dataVencimento inválida"),
        ]),
      );
    } finally {
      restore();
    }
  });

  test("bloqueia reabertura de conta recebida ao tentar voltar para pendente", async () => {
    const { restore } = mockFetchSequence([
      {
        body: [
          {
            id: "cr-4",
            tenantId: "tenant-1",
            cliente: "Maria Souza",
            descricao: "Conta recebida",
            categoria: "AVULSO",
            competencia: "2026-03-01",
            dataVencimento: "2026-03-20",
            dataRecebimento: "2026-03-21",
            valorOriginal: 55,
            desconto: 5,
            jurosMulta: 0,
            status: "RECEBIDA",
            dataCriacao: "2026-03-12T10:00:00",
          },
        ],
      },
    ]);

    try {
      await expect(
        ajustarPagamentoService({
          tenantId: "tenant-1",
          id: "cr-4",
          data: { status: "PENDENTE" },
        }),
      ).rejects.toThrow("Reabertura de conta recebida/cancelada ainda não está disponível no backend.");
    } finally {
      restore();
    }
  });
});
