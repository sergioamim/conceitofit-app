import { afterEach, describe, expect, it, vi } from "vitest";
import {
  emitirNfseEmLoteApi,
  emitirNfsePagamentoApi,
  listPagamentosApi,
  receberPagamentoApi,
} from "@/lib/api/pagamentos";
import { ApiRequestError } from "@/lib/api/http";
import * as http from "@/lib/api/http";

describe("api/pagamentos", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("listPagamentosApi", () => {
    it("GET com query completa", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listPagamentosApi({
        tenantId: "t1",
        status: "PAGO",
        alunoId: "a1",
        page: 0,
        size: 50,
      });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/comercial/pagamentos");
      expect(spy.mock.calls[0][0].query).toEqual({
        tenantId: "t1",
        status: "PAGO",
        alunoId: "a1",
        page: 0,
        size: 50,
      });
    });

    it("normaliza valores numéricos (valor, desconto, valorFinal)", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        {
          id: "p1",
          valor: "100.50",
          desconto: "10",
          valorFinal: "90.50",
          nfseEmitida: "true",
        },
      ] as never);
      const result = await listPagamentosApi({ tenantId: "t1" });
      expect(result[0].valor).toBe(100.5);
      expect(result[0].desconto).toBe(10);
      expect(result[0].valorFinal).toBe(90.5);
      expect(result[0].nfseEmitida).toBe(true);
    });

    it("trata NaN em valor como 0", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        { id: "p1", valor: "not-number", desconto: null, valorFinal: undefined },
      ] as never);
      const result = await listPagamentosApi({ tenantId: "t1" });
      expect(result[0].valor).toBe(0);
      expect(result[0].desconto).toBe(0);
      expect(result[0].valorFinal).toBe(0);
    });
  });

  describe("receberPagamentoApi", () => {
    it("POST com id no path e data no body", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await receberPagamentoApi({
        tenantId: "t1",
        id: "p1",
        data: { formaPagamentoId: "fp1", valorRecebido: 100 } as never,
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/pagamentos/p1/receber",
      );
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).toEqual({
        formaPagamentoId: "fp1",
        valorRecebido: 100,
      });
    });
  });

  describe("emitirNfsePagamentoApi", () => {
    it("POST em /{id}/nfse", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "p1",
        valor: 100,
      } as never);
      await emitirNfsePagamentoApi({ tenantId: "t1", id: "p1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/pagamentos/p1/nfse",
      );
    });

    it("converte 404 em mensagem amigável", async () => {
      vi.spyOn(http, "apiRequest").mockRejectedValue(
        new ApiRequestError({ status: 404, message: "not found" }),
      );
      await expect(
        emitirNfsePagamentoApi({ tenantId: "t1", id: "p1" }),
      ).rejects.toThrow(/Backend ainda não expõe emissão de NFSe por pagamento/);
    });

    it("converte 400 com fieldError em mensagem do erro", async () => {
      vi.spyOn(http, "apiRequest").mockRejectedValue(
        new ApiRequestError({
          status: 400,
          message: "validation",
          fieldErrors: { prefeitura: "obrigatoria" },
        }),
      );
      await expect(
        emitirNfsePagamentoApi({ tenantId: "t1", id: "p1" }),
      ).rejects.toThrow(/obrigatoria/);
    });

    it("converte 422 com message usa o próprio message do erro", async () => {
      vi.spyOn(http, "apiRequest").mockRejectedValue(
        new ApiRequestError({ status: 422, message: "config incompleta" }),
      );
      await expect(
        emitirNfsePagamentoApi({ tenantId: "t1", id: "p1" }),
      ).rejects.toThrow(/config incompleta/);
    });

    it("re-lança erro não-ApiRequestError", async () => {
      const err = new Error("network");
      vi.spyOn(http, "apiRequest").mockRejectedValue(err);
      await expect(
        emitirNfsePagamentoApi({ tenantId: "t1", id: "p1" }),
      ).rejects.toThrow("network");
    });
  });

  describe("emitirNfseEmLoteApi", () => {
    it("POST em /nfse/lote com array de ids", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await emitirNfseEmLoteApi({ tenantId: "t1", ids: ["p1", "p2"] });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/pagamentos/nfse/lote",
      );
      expect(spy.mock.calls[0][0].body).toEqual({ ids: ["p1", "p2"] });
    });

    it("aceita response como array ou envelope", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [{ id: "p1", valor: 100 }],
      } as never);
      const result = await emitirNfseEmLoteApi({ tenantId: "t1", ids: ["p1"] });
      expect(result).toHaveLength(1);
    });

    it("aceita envelope .data", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        data: [{ id: "p1", valor: 100 }],
      } as never);
      const result = await emitirNfseEmLoteApi({ tenantId: "t1", ids: ["p1"] });
      expect(result).toHaveLength(1);
    });

    it("converte 404 em mensagem de lote", async () => {
      vi.spyOn(http, "apiRequest").mockRejectedValue(
        new ApiRequestError({ status: 404, message: "not found" }),
      );
      await expect(
        emitirNfseEmLoteApi({ tenantId: "t1", ids: ["p1"] }),
      ).rejects.toThrow(/emissão de NFSe em lote/);
    });
  });
});
