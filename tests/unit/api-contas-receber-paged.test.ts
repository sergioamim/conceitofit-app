import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSumarioOperacionalContaReceberApi,
  listContasReceberPageApi,
} from "@/lib/api/contas-receber";
import * as http from "@/lib/api/http";

/**
 * Cobertura das adicoes P0-A (passos 2 e 3) no wrapper de contas a
 * receber: variante paginada com envelope + endpoint de sumario por
 * periodo. Foco na traducao dos query params e no parse dos headers de
 * paginacao (X-Total-Count, X-Page, X-Total-Pages).
 */
describe("api/contas-receber (P0-A paged + sumario)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("listContasReceberPageApi", () => {
    it("propaga query params incluindo documentoCliente e tamanho de pagina", async () => {
      const spy = vi
        .spyOn(http, "apiRequestWithMeta")
        .mockResolvedValue({ data: [], headers: {} } as never);

      await listContasReceberPageApi({
        tenantId: "tenant-1",
        status: "PENDENTE",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        documentoCliente: "11122233344",
        page: 2,
        size: 50,
      });

      const call = spy.mock.calls[0][0];
      expect(call.path).toBe("/api/v1/gerencial/financeiro/contas-receber");
      expect(call.query).toMatchObject({
        tenantId: "tenant-1",
        status: "PENDENTE",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        documentoCliente: "11122233344",
        page: 2,
        size: 50,
      });
    });

    it("le X-Total-Count e computa hasNext a partir de X-Total-Pages", async () => {
      vi.spyOn(http, "apiRequestWithMeta").mockResolvedValue({
        data: [
          {
            id: "cr1",
            tenantId: "t1",
            cliente: "Joao",
            descricao: "Mensalidade",
            categoria: "MENSALIDADE",
            competencia: "2026-04",
            dataVencimento: "2026-04-10",
            valorOriginal: "99.90",
            desconto: "0",
            jurosMulta: "0",
            status: "PENDENTE",
            geradaAutomaticamente: false,
            dataCriacao: "2026-04-01T10:00:00",
          },
        ],
        headers: {
          "x-total-count": "150",
          "x-page": "1",
          "x-size": "50",
          "x-total-pages": "3",
        },
      } as never);

      const result = await listContasReceberPageApi({
        tenantId: "t1",
        page: 1,
        size: 50,
      });

      expect(result.total).toBe(150);
      expect(result.page).toBe(1);
      expect(result.size).toBe(50);
      expect(result.hasNext).toBe(true); // pagina 1 de 3 → tem proxima
      expect(result.items).toHaveLength(1);
      expect(result.items[0].valorOriginal).toBe(99.9); // normalizou string→number
    });

    it("quando headers ausentes, fallback pra tamanho da lista e zero paginas restantes", async () => {
      vi.spyOn(http, "apiRequestWithMeta").mockResolvedValue({
        data: [],
        headers: {},
      } as never);

      const result = await listContasReceberPageApi({ tenantId: "t1" });

      expect(result.total).toBe(0);
      expect(result.page).toBe(0);
      expect(result.hasNext).toBe(false);
    });

    it("hasNext=false quando é a ultima pagina", async () => {
      vi.spyOn(http, "apiRequestWithMeta").mockResolvedValue({
        data: [],
        headers: {
          "x-total-count": "50",
          "x-page": "2",
          "x-size": "20",
          "x-total-pages": "3", // page 2 of 3 (0-indexed) → hasNext=false
        },
      } as never);

      const result = await listContasReceberPageApi({
        tenantId: "t1",
        page: 2,
        size: 20,
      });

      expect(result.hasNext).toBe(false);
    });
  });

  describe("getSumarioOperacionalContaReceberApi", () => {
    it("propaga startDate, endDate e documentoCliente", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({
          totalRecebido: 0,
          totalPendente: 0,
          totalVencido: 0,
          countRecebido: 0,
          countPendente: 0,
          countVencido: 0,
          countTotal: 0,
        } as never);

      await getSumarioOperacionalContaReceberApi({
        tenantId: "t1",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        documentoCliente: "11122233344",
      });

      const call = spy.mock.calls[0][0];
      expect(call.path).toBe(
        "/api/v1/gerencial/financeiro/contas-receber/sumario-operacional",
      );
      expect(call.query).toMatchObject({
        tenantId: "t1",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        documentoCliente: "11122233344",
      });
    });

    it("normaliza valores string do backend para numeros", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        totalRecebido: "1500.50",
        totalPendente: "300.00",
        totalVencido: "100",
        countRecebido: "5",
        countPendente: "3",
        countVencido: "1",
        countTotal: "9",
      } as never);

      const result = await getSumarioOperacionalContaReceberApi({ tenantId: "t1" });

      expect(result).toEqual({
        totalRecebido: 1500.5,
        totalPendente: 300,
        totalVencido: 100,
        countRecebido: 5,
        countPendente: 3,
        countVencido: 1,
        countTotal: 9,
      });
    });

    it("quando backend retorna null/undefined em algum campo, cai em zero", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        totalRecebido: null,
        totalPendente: undefined,
        totalVencido: "0",
        countRecebido: null,
        countPendente: 0,
        countVencido: "0",
        countTotal: null,
      } as never);

      const result = await getSumarioOperacionalContaReceberApi({ tenantId: "t1" });

      expect(result.totalRecebido).toBe(0);
      expect(result.totalPendente).toBe(0);
      expect(result.countRecebido).toBe(0);
      expect(result.countTotal).toBe(0);
    });
  });
});
