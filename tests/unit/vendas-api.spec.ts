import { expect, test } from "@playwright/test";
import { createVendaApi, getVendaApi, listVendasApi } from "../../src/lib/api/vendas";
import { mockFetchWithSequence } from "./support/test-runtime";

const envSnapshot = {
  devAutoLogin: process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN,
};

test.beforeEach(() => {
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
});

test.afterEach(() => {
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = envSnapshot.devAutoLogin;
});

test.describe("vendas api", () => {
  test("deduplica requests em voo e normaliza envelopes com totais por forma de pagamento", async () => {
    let resolveFirstRequest = () => undefined;
    const firstResponse = new Promise<Response>((resolve) => {
      resolveFirstRequest = () =>
        resolve(
          new Response(
            JSON.stringify({
              items: [
                {
                  id: "vd-1",
                  tenantId: "tenant-1",
                  tipo: "PLANO",
                  status: "FECHADA",
                  itens: [
                    {
                      id: "item-1",
                      tipo: "PLANO",
                      referenciaId: "pl-1",
                      descricao: "Plano trimestral",
                      quantidade: 1,
                      valorUnitario: "199.9",
                      desconto: "10",
                      valorTotal: "189.9",
                    },
                  ],
                  subtotal: "199.9",
                  descontoTotal: "10",
                  acrescimoTotal: "0",
                  total: "189.9",
                  pagamento: {
                    formaPagamento: "PIX",
                    parcelas: "1",
                    valorPago: "189.9",
                    status: "PAGO",
                  },
                  contratoStatus: "ASSINADO",
                  dataCriacao: "2026-03-14T10:00:00Z",
                },
              ],
              page: 1,
              size: 20,
              total: 44,
              hasNext: true,
              totais: {
                totalGeral: "189.9",
                totalPorFormaPagamento: [
                  {
                    formaPagamento: "PIX",
                    total: "189.9",
                  },
                ],
                registrosSemPagamento: "2",
                registrosComPagamentoAusente: "1",
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        );
    });

    const { calls, restore } = mockFetchWithSequence([
      () => firstResponse,
      {
        body: [
          {
            id: "vd-2",
            tenantId: "tenant-1",
            tipo: "SERVICO",
            status: "FECHADA",
            itens: [],
            subtotal: 79.9,
            descontoTotal: 0,
            acrescimoTotal: 0,
            total: 79.9,
            pagamento: {
              formaPagamento: "DESCONHECIDA",
              valorPago: 79.9,
            },
            dataCriacao: "2026-03-14T11:00:00Z",
          },
        ],
      },
    ]);

    try {
      const first = listVendasApi({
        tenantId: "tenant-1",
        page: 1,
        size: 20,
        envelope: true,
      });
      const second = listVendasApi({
        tenantId: "tenant-1",
        page: 1,
        size: 20,
        envelope: true,
      });
      resolveFirstRequest();
      const [envelope, repeatedEnvelope] = await Promise.all([first, second]);
      if (Array.isArray(envelope)) {
        throw new Error("Era esperado envelope paginado.");
      }
      if (Array.isArray(repeatedEnvelope)) {
        throw new Error("Era esperado envelope paginado.");
      }
      expect(envelope.page).toBe(1);
      expect(envelope.total).toBe(44);
      expect(envelope.hasNext).toBe(true);
      expect(envelope.totalGeral).toBe(189.9);
      expect(envelope.totaisPorFormaPagamento).toEqual({ PIX: 189.9 });
      expect(envelope.registrosSemPagamento).toBe(2);
      expect(envelope.registrosComPagamentoAusente).toBe(1);
      expect(envelope.items[0]?.pagamento.formaPagamento).toBe("PIX");
      expect(envelope.items[0]?.itens[0]?.valorUnitario).toBe(199.9);
      expect(repeatedEnvelope.items).toEqual(envelope.items);

      const list = await listVendasApi({
        tenantId: "tenant-1",
      });
      expect(Array.isArray(list)).toBe(true);
      expect(Array.isArray(list) ? list[0]?.pagamento.formaPagamento : undefined).toBe("PIX");

      expect(calls).toHaveLength(2);
      expect(calls[0].url).toContain("/api/v1/comercial/vendas");
      expect(calls[0].url).toContain("envelope=true");
    } finally {
      restore();
    }
  });

  test("normaliza create/get e deduplica itens de plano pelo contexto canonico", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          id: "vd-3",
          tenantId: "tenant-1",
          tipo: "PLANO",
          status: "FECHADA",
          itens: [
            {
              id: "item-3",
              tipo: "PLANO",
              referenciaId: "pl-42",
              descricao: "Plano anual",
              quantidade: 1,
              valorUnitario: 999.9,
              desconto: 100,
              valorTotal: 899.9,
            },
          ],
          subtotal: 999.9,
          descontoTotal: 100,
          acrescimoTotal: 0,
          total: 899.9,
          pagamento: {
            formaPagamento: "CARTAO_CREDITO",
            parcelas: 12,
            valorPago: 899.9,
            status: "PENDENTE",
            observacoes: "parcelado",
          },
          planoId: "pl-42",
          matriculaId: "mat-1",
          contratoStatus: "PENDENTE_ASSINATURA",
          dataInicioContrato: "2026-03-15",
          dataFimContrato: "2027-03-15",
          dataCriacao: "2026-03-14T12:00:00Z",
        },
      },
      {
        body: {
          id: "vd-4",
          tenantId: "tenant-1",
          tipo: "PRODUTO",
          status: "FECHADA",
          itens: [],
          subtotal: "15",
          descontoTotal: "0",
          acrescimoTotal: "0",
          total: "15",
          pagamento: null,
          dataCriacao: "2026-03-14T12:05:00Z",
        },
      },
    ]);

    try {
      const created = await createVendaApi({
        tenantId: "tenant-1",
        data: {
          tipo: "PLANO",
          itens: [
            {
              tipo: "PLANO",
              referenciaId: "pl-42:legado",
              descricao: "Plano anual",
              quantidade: 1,
              valorUnitario: 999.9,
              desconto: 100,
            },
            {
              tipo: "PLANO",
              referenciaId: "pl-42",
              descricao: "Plano anual duplicado",
              quantidade: 1,
              valorUnitario: 999.9,
            },
            {
              tipo: "PRODUTO",
              referenciaId: "prod-1",
              descricao: "Shake",
              quantidade: 1,
              valorUnitario: 12,
            },
          ],
          pagamento: {
            formaPagamento: "CARTAO_CREDITO",
            parcelas: 12,
            valorPago: 899.9,
            status: "PENDENTE",
          },
          planoContexto: {
            planoId: "pl-42",
            dataInicio: "2026-03-15",
            descontoPlano: 100,
          },
        },
      });
      expect(created.planoId).toBe("pl-42");
      expect(created.pagamento.status).toBe("PENDENTE");
      expect(created.pagamento.parcelas).toBe(12);
      expect(created.contratoStatus).toBe("PENDENTE_ASSINATURA");

      const createdBody = calls[0].body ?? "";
      expect(createdBody).toContain("\"referenciaId\":\"pl-42\"");
      expect(createdBody).not.toContain("pl-42:legado");

      const loaded = await getVendaApi({
        tenantId: "tenant-1",
        id: "vd-4",
      });
      expect(loaded.pagamento.formaPagamento).toBe("PIX");
      expect(loaded.pagamento.status).toBe("PAGO");
      expect(loaded.total).toBe(15);

      expect(calls[0].method).toBe("POST");
      expect(calls[1].url).toContain("/api/v1/comercial/vendas/vd-4");
    } finally {
      restore();
    }
  });
});
