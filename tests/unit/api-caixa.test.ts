import { afterEach, describe, expect, it, vi } from "vitest";
import {
  abrirCaixa,
  ajusteAdmin,
  criarSangria,
  fecharCaixa,
  getCaixaAtivo,
  getDashboard,
  getDiferencas,
  listarCaixas,
} from "@/lib/api/caixa";
import { ApiRequestError } from "@/lib/api/http";
import * as http from "@/lib/api/http";
import type { CaixaApiError } from "@/lib/api/caixa-errors";
import {
  isCaixaApiError,
  mapCaixaError,
} from "@/lib/api/caixa-error-handler";

function mockApiRequest<T>(value: T) {
  return vi.spyOn(http, "apiRequest").mockResolvedValue(value as never);
}

function mockApiRequestWithMeta<T>(data: T) {
  return vi
    .spyOn(http, "apiRequestWithMeta")
    .mockResolvedValue({ data, headers: {} } as never);
}

function makeApiError(
  status: number,
  body: Record<string, unknown>,
  overrides: Partial<ConstructorParameters<typeof ApiRequestError>[0]> = {},
) {
  return new ApiRequestError({
    statusCode: status,
    message: (body.message as string | undefined) ?? `HTTP ${status}`,
    responseBody: JSON.stringify(body),
    ...overrides,
  });
}

describe("api/caixa", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // abrirCaixa
  // -------------------------------------------------------------------------
  describe("abrirCaixa", () => {
    it("POST /api/caixas/abrir com body tipado", async () => {
      const spy = mockApiRequest({ id: "c1" });
      await abrirCaixa({
        valorAbertura: 100,
        observacoes: "abertura",
      });
      expect(spy.mock.calls[0][0].path).toBe("/api/caixas/abrir");
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).toEqual({
        valorAbertura: 100,
        observacoes: "abertura",
      });
    });

    it("converte 409 CAIXA_JA_ABERTO em CaixaApiError tipado", async () => {
      vi.spyOn(http, "apiRequest").mockRejectedValue(
        makeApiError(409, {
          code: "CAIXA_JA_ABERTO",
          caixaAtivoId: "c1",
          abertoEm: "2026-04-14T09:30:00",
        }),
      );
      try {
        await abrirCaixa({ valorAbertura: 0 });
        expect.fail("should have thrown");
      } catch (err) {
        expect(isCaixaApiError(err)).toBe(true);
        if (isCaixaApiError(err) && err.code === "CAIXA_JA_ABERTO") {
          expect(err.caixaAtivoId).toBe("c1");
          expect(err.abertoEm).toBe("2026-04-14T09:30:00");
        }
      }
    });

    it("re-lança ApiRequestError quando body não tem code Caixa*", async () => {
      const error = makeApiError(500, { message: "internal" });
      vi.spyOn(http, "apiRequest").mockRejectedValue(error);
      await expect(
        abrirCaixa({ valorAbertura: 0 }),
      ).rejects.toBe(error);
    });
  });

  // -------------------------------------------------------------------------
  // getCaixaAtivo
  // -------------------------------------------------------------------------
  describe("getCaixaAtivo", () => {
    it("GET /api/caixas/ativo retorna null em 204 (body vazio)", async () => {
      mockApiRequestWithMeta(null);
      const result = await getCaixaAtivo();
      expect(result).toBeNull();
    });

    it("retorna objeto { caixa, saldo } quando 200", async () => {
      const spy = mockApiRequestWithMeta({
        caixa: { id: "c1", status: "ABERTO" } as never,
        saldo: { caixaId: "c1", total: 100 } as never,
      });
      const result = await getCaixaAtivo();
      expect(spy.mock.calls[0][0].path).toBe("/api/caixas/ativo");
      expect(spy.mock.calls[0][0].method).toBe("GET");
      expect(result?.caixa.id).toBe("c1");
      expect(result?.saldo.total).toBe(100);
    });

    it("retorna null quando response.data não tem caixa/saldo", async () => {
      mockApiRequestWithMeta({} as never);
      const result = await getCaixaAtivo();
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // fecharCaixa
  // -------------------------------------------------------------------------
  describe("fecharCaixa", () => {
    it("POST /api/caixas/{id}/fechar com body", async () => {
      const spy = mockApiRequest({ diferenca: 0 });
      await fecharCaixa("c1", { valorInformado: 100, observacoes: null });
      expect(spy.mock.calls[0][0].path).toBe("/api/caixas/c1/fechar");
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).toEqual({
        valorInformado: 100,
        observacoes: null,
      });
    });

    it("409 CAIXA_JA_FECHADO → CaixaApiError", async () => {
      vi.spyOn(http, "apiRequest").mockRejectedValue(
        makeApiError(409, { code: "CAIXA_JA_FECHADO" }),
      );
      try {
        await fecharCaixa("c1", { valorInformado: 100 });
        expect.fail("should have thrown");
      } catch (err) {
        expect(isCaixaApiError(err)).toBe(true);
        if (isCaixaApiError(err)) {
          expect(err.code).toBe("CAIXA_JA_FECHADO");
        }
      }
    });

    it("encoda id com caracteres especiais", async () => {
      const spy = mockApiRequest({});
      await fecharCaixa("c1/hack", { valorInformado: 0 });
      expect(spy.mock.calls[0][0].path).toBe("/api/caixas/c1%2Fhack/fechar");
    });
  });

  // -------------------------------------------------------------------------
  // criarSangria
  // -------------------------------------------------------------------------
  describe("criarSangria", () => {
    it("POST /api/caixas/{id}/sangria com body", async () => {
      const spy = mockApiRequest({ sangria: {}, movimento: {} });
      await criarSangria("c1", {
        valor: 50,
        motivo: "troca",
        autorizadoPor: "u1",
      });
      expect(spy.mock.calls[0][0].path).toBe("/api/caixas/c1/sangria");
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).toEqual({
        valor: 50,
        motivo: "troca",
        autorizadoPor: "u1",
      });
    });

    it("403 SANGRIA_SEM_AUTORIZACAO → CaixaApiError", async () => {
      vi.spyOn(http, "apiRequest").mockRejectedValue(
        makeApiError(403, { code: "SANGRIA_SEM_AUTORIZACAO" }),
      );
      await expect(
        criarSangria("c1", { valor: 50, motivo: "x", autorizadoPor: "u1" }),
      ).rejects.toMatchObject({ code: "SANGRIA_SEM_AUTORIZACAO" });
    });
  });

  // -------------------------------------------------------------------------
  // listarCaixas
  // -------------------------------------------------------------------------
  describe("listarCaixas", () => {
    it("GET /api/caixas com query completa", async () => {
      const spy = mockApiRequest([]);
      await listarCaixas({
        status: "ABERTO",
        operadorId: "u1",
        from: "2026-04-01",
        to: "2026-04-14",
      });
      expect(spy.mock.calls[0][0].path).toBe("/api/caixas");
      expect(spy.mock.calls[0][0].method).toBe("GET");
      expect(spy.mock.calls[0][0].query).toEqual({
        status: "ABERTO",
        operadorId: "u1",
        from: "2026-04-01",
        to: "2026-04-14",
      });
    });

    it("query undefined quando filter vazio", async () => {
      const spy = mockApiRequest([]);
      await listarCaixas({});
      expect(spy.mock.calls[0][0].query).toEqual({
        status: undefined,
        operadorId: undefined,
        from: undefined,
        to: undefined,
      });
    });
  });

  // -------------------------------------------------------------------------
  // getDashboard
  // -------------------------------------------------------------------------
  describe("getDashboard", () => {
    it("GET /api/caixas/dashboard?data=YYYY-MM-DD", async () => {
      const spy = mockApiRequest({
        data: "2026-04-14",
        caixasAbertos: [],
        caixasFechados: [],
        totalMovimentado: {},
        alertasDiferencaCount: 0,
      });
      await getDashboard("2026-04-14");
      expect(spy.mock.calls[0][0].path).toBe("/api/caixas/dashboard");
      expect(spy.mock.calls[0][0].query).toEqual({ data: "2026-04-14" });
    });
  });

  // -------------------------------------------------------------------------
  // getDiferencas
  // -------------------------------------------------------------------------
  describe("getDiferencas", () => {
    it("GET /api/caixas/diferencas com filtros", async () => {
      const spy = mockApiRequest([]);
      await getDiferencas({
        from: "2026-04-01",
        to: "2026-04-14",
        operadorId: "u1",
      });
      expect(spy.mock.calls[0][0].path).toBe("/api/caixas/diferencas");
      expect(spy.mock.calls[0][0].query).toEqual({
        from: "2026-04-01",
        to: "2026-04-14",
        operadorId: "u1",
      });
    });
  });

  // -------------------------------------------------------------------------
  // ajusteAdmin
  // -------------------------------------------------------------------------
  describe("ajusteAdmin", () => {
    it("POST /api/caixas/{id}/movimentos/ajuste-admin com body", async () => {
      const spy = mockApiRequest({ id: "m1" });
      await ajusteAdmin("c1", {
        tipo: "AJUSTE_ENTRADA",
        valor: 10,
        formaPagamento: "DINHEIRO",
        motivo: "conferencia semanal",
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/caixas/c1/movimentos/ajuste-admin",
      );
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).toEqual({
        tipo: "AJUSTE_ENTRADA",
        valor: 10,
        formaPagamento: "DINHEIRO",
        motivo: "conferencia semanal",
      });
    });

    it("409 CAIXA_JA_FECHADO em ajuste-admin → CaixaApiError", async () => {
      vi.spyOn(http, "apiRequest").mockRejectedValue(
        makeApiError(409, { code: "CAIXA_JA_FECHADO" }),
      );
      await expect(
        ajusteAdmin("c1", {
          tipo: "AJUSTE_SAIDA",
          valor: 5,
          motivo: "motivo qualquer",
        }),
      ).rejects.toMatchObject({ code: "CAIXA_JA_FECHADO" });
    });
  });

  // -------------------------------------------------------------------------
  // CAIXA_NAO_ABERTO e CAIXA_DIA_ANTERIOR em abrir/fechar
  // -------------------------------------------------------------------------
  describe("error mapping — edge codes", () => {
    it("409 CAIXA_NAO_ABERTO em fecharCaixa → CaixaApiError com ABRIR_CAIXA", async () => {
      vi.spyOn(http, "apiRequest").mockRejectedValue(
        makeApiError(409, {
          code: "CAIXA_NAO_ABERTO",
          caixaCatalogoSugerido: "cc1",
        }),
      );
      try {
        await fecharCaixa("c1", { valorInformado: 0 });
        expect.fail("should have thrown");
      } catch (err) {
        expect(isCaixaApiError(err)).toBe(true);
        if (isCaixaApiError(err) && err.code === "CAIXA_NAO_ABERTO") {
          expect(err.acaoSugerida).toBe("ABRIR_CAIXA");
        }
      }
    });

    it("409 CAIXA_DIA_ANTERIOR em abrirCaixa → CaixaApiError com FECHAR_E_REABRIR", async () => {
      vi.spyOn(http, "apiRequest").mockRejectedValue(
        makeApiError(409, {
          code: "CAIXA_DIA_ANTERIOR",
          caixaAtivoId: "c-old",
          abertoEm: "2026-04-13T09:00:00",
        }),
      );
      try {
        await abrirCaixa({ valorAbertura: 0 });
        expect.fail("should have thrown");
      } catch (err) {
        expect(isCaixaApiError(err)).toBe(true);
        if (isCaixaApiError(err) && err.code === "CAIXA_DIA_ANTERIOR") {
          expect(err.caixaAtivoId).toBe("c-old");
          expect(err.acaoSugerida).toBe("FECHAR_E_REABRIR");
        }
      }
    });

    it("responseBody não-JSON → re-lança ApiRequestError original", async () => {
      const error = new ApiRequestError({
        statusCode: 409,
        message: "boom",
        responseBody: "<html>oops</html>",
      });
      vi.spyOn(http, "apiRequest").mockRejectedValue(error);
      await expect(
        abrirCaixa({ valorAbertura: 0 }),
      ).rejects.toBe(error);
    });

    it("responseBody com code desconhecido → re-lança ApiRequestError original", async () => {
      const error = makeApiError(409, { code: "ALGO_ESTRANHO" });
      vi.spyOn(http, "apiRequest").mockRejectedValue(error);
      await expect(
        abrirCaixa({ valorAbertura: 0 }),
      ).rejects.toBe(error);
    });
  });
});

// -----------------------------------------------------------------------------
// caixa-error-handler
// -----------------------------------------------------------------------------

describe("caixa-error-handler", () => {
  describe("isCaixaApiError", () => {
    it("aceita um CaixaApiError válido", () => {
      const err: CaixaApiError = { code: "CAIXA_JA_FECHADO" };
      expect(isCaixaApiError(err)).toBe(true);
    });

    it("rejeita null / undefined / primitivos", () => {
      expect(isCaixaApiError(null)).toBe(false);
      expect(isCaixaApiError(undefined)).toBe(false);
      expect(isCaixaApiError("CAIXA_JA_FECHADO")).toBe(false);
      expect(isCaixaApiError(123)).toBe(false);
    });

    it("rejeita object sem code", () => {
      expect(isCaixaApiError({ message: "x" })).toBe(false);
    });

    it("rejeita object com code desconhecido", () => {
      expect(isCaixaApiError({ code: "OUTRO" })).toBe(false);
    });
  });

  describe("mapCaixaError", () => {
    it("CAIXA_JA_ABERTO → titulo/mensagem/acao", () => {
      const presentation = mapCaixaError({
        code: "CAIXA_JA_ABERTO",
        caixaAtivoId: "c1",
        abertoEm: "2026-04-14T09:30:00",
      });
      expect(presentation.titulo).toBe("Caixa já aberto");
      expect(presentation.mensagem).toContain("aberto desde");
      expect(presentation.acaoSugerida).toEqual({
        label: "Ver caixa ativo",
        href: "/caixa",
      });
    });

    it("CAIXA_NAO_ABERTO → acao ABRIR_CAIXA", () => {
      const presentation = mapCaixaError({
        code: "CAIXA_NAO_ABERTO",
        acaoSugerida: "ABRIR_CAIXA",
      });
      expect(presentation.titulo).toBe("Sem caixa aberto");
      expect(presentation.acaoSugerida?.action).toBe("ABRIR_CAIXA");
    });

    it("CAIXA_DIA_ANTERIOR → acao FECHAR_E_REABRIR", () => {
      const presentation = mapCaixaError({
        code: "CAIXA_DIA_ANTERIOR",
        caixaAtivoId: "c1",
        abertoEm: "2026-04-13T09:00:00",
        acaoSugerida: "FECHAR_E_REABRIR",
      });
      expect(presentation.titulo).toBe("Caixa de dia anterior");
      expect(presentation.mensagem).toContain("encerrado");
      expect(presentation.acaoSugerida?.action).toBe("FECHAR_E_REABRIR");
    });

    it("SANGRIA_SEM_AUTORIZACAO → sem acaoSugerida", () => {
      const presentation = mapCaixaError({
        code: "SANGRIA_SEM_AUTORIZACAO",
      });
      expect(presentation.titulo).toBe("Sangria não autorizada");
      expect(presentation.acaoSugerida).toBeUndefined();
    });

    it("CAIXA_JA_FECHADO → sem acaoSugerida", () => {
      const presentation = mapCaixaError({ code: "CAIXA_JA_FECHADO" });
      expect(presentation.titulo).toBe("Caixa já fechado");
      expect(presentation.acaoSugerida).toBeUndefined();
    });

    it("mantém string original quando abertoEm é inválido", () => {
      const presentation = mapCaixaError({
        code: "CAIXA_JA_ABERTO",
        caixaAtivoId: "c1",
        abertoEm: "nao-eh-data",
      });
      expect(presentation.mensagem).toContain("nao-eh-data");
    });
  });
});
