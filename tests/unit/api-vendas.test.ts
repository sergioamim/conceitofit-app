import { afterEach, describe, expect, it, vi } from "vitest";
import { createVendaApi, getVendaApi, listVendasApi } from "@/lib/api/vendas";
import * as http from "@/lib/api/http";

describe("api/vendas", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("listVendasApi (array mode)", () => {
    it("GET /comercial/vendas retorna array normalizado", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([
        {
          id: "v1",
          tenantId: "t1",
          tipo: "PLANO",
          status: "CONCLUIDA",
          itens: [
            {
              id: "i1",
              tipo: "PLANO",
              referenciaId: "p1",
              descricao: "Plano",
              quantidade: 1,
              valorUnitario: 100,
              desconto: 0,
              valorTotal: 100,
            },
          ],
          subtotal: 100,
          descontoTotal: 0,
          acrescimoTotal: 0,
          total: 100,
          pagamento: {
            formaPagamento: "PIX",
            valorPago: 100,
          },
          dataCriacao: "2026-04-10",
        },
      ] as never);
      const result = (await listVendasApi({ tenantId: "t1" })) as unknown[];
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/comercial/vendas");
      expect(result).toHaveLength(1);
    });

    it("normaliza pagamento ausente com forma default PIX", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        {
          id: "v1",
          tenantId: "t1",
          tipo: "PLANO",
          status: "CONCLUIDA",
          itens: [],
          subtotal: 0,
          descontoTotal: 0,
          acrescimoTotal: 0,
          total: 100,
          dataCriacao: "2026-04-10",
        },
      ] as never);
      const result = (await listVendasApi({
        tenantId: "t1",
      })) as { pagamento: { formaPagamento: string; valorPago: number } }[];
      expect(result[0].pagamento.formaPagamento).toBe("PIX");
      expect(result[0].pagamento.valorPago).toBe(100);
    });

    it("extrai vendas de envelope quando não-array", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [
          {
            id: "v1",
            tenantId: "t1",
            tipo: "PLANO",
            status: "CONCLUIDA",
            itens: [],
            subtotal: 0,
            descontoTotal: 0,
            acrescimoTotal: 0,
            total: 0,
            dataCriacao: "2026-04-10",
          },
        ],
      } as never);
      const result = (await listVendasApi({ tenantId: "t1" })) as unknown[];
      expect(result).toHaveLength(1);
    });
  });

  describe("listVendasApi (envelope mode)", () => {
    it("retorna envelope com paginação quando envelope=true", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [],
        page: 0,
        size: 20,
        total: 0,
        hasNext: false,
        totais: {
          totalGeral: 1000,
          totalPorFormaPagamento: { PIX: 500, DINHEIRO: 500 },
        },
      } as never);
      const result = (await listVendasApi({
        tenantId: "t1",
        envelope: true,
      })) as {
        page: number;
        size: number;
        totalGeral?: number;
        totaisPorFormaPagamento?: Record<string, number>;
      };
      expect(result.page).toBe(0);
      expect(result.size).toBe(20);
      expect(result.totalGeral).toBe(1000);
      expect(result.totaisPorFormaPagamento?.PIX).toBe(500);
    });

    it("envelope array → normaliza para envelope result", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        {
          id: "v1",
          tenantId: "t1",
          tipo: "PLANO",
          status: "CONCLUIDA",
          itens: [],
          subtotal: 0,
          descontoTotal: 0,
          acrescimoTotal: 0,
          total: 0,
          dataCriacao: "2026-04-10",
        },
      ] as never);
      const result = (await listVendasApi({
        tenantId: "t1",
        envelope: true,
      })) as { items: unknown[]; total?: number; hasNext: boolean };
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.hasNext).toBe(false);
    });

    it("totaisPorFormaPagamento como array", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [],
        totaisPorFormaPagamento: [
          { formaPagamento: "PIX", total: 100 },
          { tipo: "DINHEIRO", valor: 50 },
        ],
      } as never);
      const result = (await listVendasApi({
        tenantId: "t1",
        envelope: true,
      })) as { totaisPorFormaPagamento?: Record<string, number> };
      expect(result.totaisPorFormaPagamento?.PIX).toBe(100);
      expect(result.totaisPorFormaPagamento?.DINHEIRO).toBe(50);
    });
  });

  describe("createVendaApi", () => {
    it("POST /comercial/vendas com body normalizado", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "v1",
        tenantId: "t1",
        tipo: "PLANO",
        status: "CONCLUIDA",
        itens: [],
        subtotal: 0,
        descontoTotal: 0,
        acrescimoTotal: 0,
        total: 0,
        dataCriacao: "2026-04-10",
      } as never);
      await createVendaApi({
        tenantId: "t1",
        data: {
          tipo: "PLANO",
          clienteId: "c1",
          itens: [
            {
              tipo: "PLANO",
              referenciaId: "p1",
              descricao: "Plano",
              quantidade: 1,
              valorUnitario: 100,
            },
          ],
          pagamento: {
            formaPagamento: "PIX",
            valorPago: 100,
          },
        },
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/comercial/vendas");
      const body = spy.mock.calls[0][0].body as Record<string, unknown>;
      expect(body.tipo).toBe("PLANO");
      expect(body.clienteId).toBe("c1");
    });

    it("deduplica planoIds em itens PLANO", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "v1",
        tenantId: "t1",
        tipo: "PLANO",
        status: "CONCLUIDA",
        itens: [],
        subtotal: 0,
        descontoTotal: 0,
        acrescimoTotal: 0,
        total: 0,
        dataCriacao: "2026-04-10",
      } as never);
      await createVendaApi({
        tenantId: "t1",
        data: {
          tipo: "PLANO",
          itens: [
            {
              tipo: "PLANO",
              referenciaId: "p1:suffix",
              descricao: "A",
              quantidade: 1,
              valorUnitario: 100,
            },
            {
              tipo: "PLANO",
              referenciaId: "p1:outro",
              descricao: "B",
              quantidade: 1,
              valorUnitario: 100,
            },
          ],
          pagamento: { formaPagamento: "PIX", valorPago: 100 },
        },
      });
      const body = spy.mock.calls[0][0].body as { itens: unknown[] };
      expect(body.itens).toHaveLength(1);
    });
  });

  describe("getVendaApi", () => {
    it("GET /comercial/vendas/{id}", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "v1",
        tenantId: "t1",
        tipo: "PLANO",
        status: "CONCLUIDA",
        itens: [],
        subtotal: 0,
        descontoTotal: 0,
        acrescimoTotal: 0,
        total: 0,
        dataCriacao: "2026-04-10",
      } as never);
      await getVendaApi({ tenantId: "t1", id: "v1" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/comercial/vendas/v1");
    });
  });
});
