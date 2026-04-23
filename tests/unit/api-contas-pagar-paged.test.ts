import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSumarioOperacionalContaPagarApi,
  listContasPagarPageApi,
} from "@/lib/api/financeiro-gerencial";
import * as http from "@/lib/api/http";

/**
 * Cobertura das adicoes F4 (contas a pagar) no wrapper de financeiro
 * gerencial: variante paginada com envelope + endpoint de sumario por
 * periodo (backend F1). Foco na traducao dos query params e no parse
 * dos headers de paginacao (X-Total-Count, X-Page, X-Total-Pages).
 */
describe("api/financeiro-gerencial (F4 contas a pagar paged + sumario)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("listContasPagarPageApi", () => {
    it("propaga todos os filtros (status/categoria/tipoContaId/grupoDre/origem/periodo/documentoFornecedor)", async () => {
      const spy = vi
        .spyOn(http, "apiRequestWithMeta")
        .mockResolvedValue({ data: [], headers: {} } as never);

      await listContasPagarPageApi({
        tenantId: "t-1",
        status: "PENDENTE",
        categoria: "ALUGUEL",
        tipoContaId: "tc-1",
        grupoDre: "DESPESA_OPERACIONAL",
        origem: "MANUAL",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        documentoFornecedor: "12345678000199",
        page: 2,
        size: 50,
      });

      const call = spy.mock.calls[0][0];
      expect(call.path).toBe("/api/v1/gerencial/financeiro/contas-pagar");
      expect(call.query).toMatchObject({
        tenantId: "t-1",
        status: "PENDENTE",
        categoria: "ALUGUEL",
        tipoContaId: "tc-1",
        grupoDre: "DESPESA_OPERACIONAL",
        origem: "MANUAL",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        documentoFornecedor: "12345678000199",
        page: 2,
        size: 50,
      });
    });

    it("le headers de paginacao e normaliza campos numericos", async () => {
      vi.spyOn(http, "apiRequestWithMeta").mockResolvedValue({
        data: [
          {
            id: "cp-1",
            tenantId: "t-1",
            fornecedor: "Imobiliaria",
            descricao: "Aluguel",
            categoria: "ALUGUEL",
            regime: "FIXA",
            competencia: "2026-04",
            dataVencimento: "2026-04-10",
            valorOriginal: "12800.00",
            desconto: "0",
            jurosMulta: "0",
            status: "PENDENTE",
            dataCriacao: "2026-04-01T10:00:00",
          },
        ],
        headers: {
          "x-total-count": "40",
          "x-page": "1",
          "x-size": "20",
          "x-total-pages": "2",
        },
      } as never);

      const r = await listContasPagarPageApi({
        tenantId: "t-1",
        page: 1,
        size: 20,
      });

      expect(r.total).toBe(40);
      expect(r.page).toBe(1);
      expect(r.size).toBe(20);
      expect(r.hasNext).toBe(false); // pagina 1 de 2 (0-indexed) = ultima
      expect(r.items).toHaveLength(1);
      expect(r.items[0].valorOriginal).toBe(12800); // normalizou string→number
    });

    it("hasNext=true quando nao e ultima pagina", async () => {
      vi.spyOn(http, "apiRequestWithMeta").mockResolvedValue({
        data: [],
        headers: {
          "x-total-count": "200",
          "x-page": "0",
          "x-size": "50",
          "x-total-pages": "4",
        },
      } as never);

      const r = await listContasPagarPageApi({ tenantId: "t-1", page: 0, size: 50 });
      expect(r.hasNext).toBe(true);
    });

    it("sem headers, fallback seguro", async () => {
      vi.spyOn(http, "apiRequestWithMeta").mockResolvedValue({
        data: [],
        headers: {},
      } as never);

      const r = await listContasPagarPageApi({ tenantId: "t-1" });
      expect(r.total).toBe(0);
      expect(r.hasNext).toBe(false);
    });
  });

  describe("getSumarioOperacionalContaPagarApi", () => {
    it("GET /contas-pagar/sumario-operacional com filtros", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        totalPago: 0,
        totalPendente: 0,
        totalVencido: 0,
        countPago: 0,
        countPendente: 0,
        countVencido: 0,
        countTotal: 0,
      } as never);

      await getSumarioOperacionalContaPagarApi({
        tenantId: "t-1",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        documentoFornecedor: "12345678000199",
      });

      const call = spy.mock.calls[0][0];
      expect(call.path).toBe(
        "/api/v1/gerencial/financeiro/contas-pagar/sumario-operacional",
      );
      expect(call.query).toMatchObject({
        tenantId: "t-1",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        documentoFornecedor: "12345678000199",
      });
    });

    it("normaliza strings em numeros + null → 0", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        totalPago: "6450.00",
        totalPendente: "3200.00",
        totalVencido: null,
        countPago: "5",
        countPendente: "3",
        countVencido: undefined,
        countTotal: "8",
      } as never);

      const r = await getSumarioOperacionalContaPagarApi({ tenantId: "t-1" });

      expect(r.totalPago).toBe(6450);
      expect(r.totalPendente).toBe(3200);
      expect(r.totalVencido).toBe(0);
      expect(r.countPago).toBe(5);
      expect(r.countPendente).toBe(3);
      expect(r.countVencido).toBe(0);
      expect(r.countTotal).toBe(8);
    });
  });
});
