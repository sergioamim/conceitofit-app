import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cancelarContratoApi as cancelarMatriculaApi,
  createContratoApi as createMatriculaApi,
  listContratosApi as listMatriculasApi,
  listContratosByAlunoApi as listMatriculasByAlunoApi,
  listContratosDashboardMensalApi as listMatriculasDashboardMensalApi,
  listContratosPageApi as listMatriculasPageApi,
  normalizeContratoApiResponse as normalizeMatriculaApiResponse,
  renovarContratoApi as renovarMatriculaApi,
  signContratoApi as signMatriculaContractApi,
} from "@/lib/api/matriculas";
import * as http from "@/lib/api/http";
import { ApiRequestError } from "@/lib/api/http";

describe("api/matriculas", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("normalizeMatriculaApiResponse", () => {
    it("normaliza resposta mínima", () => {
      const result = normalizeMatriculaApiResponse({ id: "m1" });
      expect(result.id).toBe("m1");
      expect(result.status).toBe("ATIVA");
      expect(result.formaPagamento).toBe("PIX");
      expect(result.valorPago).toBe(0);
      expect(result.renovacaoAutomatica).toBe(false);
    });

    it("usa clienteId como alunoId fallback", () => {
      const result = normalizeMatriculaApiResponse({
        id: "m1",
        clienteId: "c1",
      });
      expect(result.alunoId).toBe("c1");
    });

    it("prefere alunoId sobre clienteId", () => {
      const result = normalizeMatriculaApiResponse({
        id: "m1",
        alunoId: "a1",
        clienteId: "c1",
      });
      expect(result.alunoId).toBe("a1");
    });

    it("normaliza aluno embedded (via cliente)", () => {
      const result = normalizeMatriculaApiResponse({
        id: "m1",
        tenantId: "t1",
        cliente: {
          id: "a1",
          nome: "Aluno",
          email: "a@b.com",
        } as never,
      });
      expect(result.aluno?.id).toBe("a1");
      expect(result.aluno?.nome).toBe("Aluno");
      expect(result.alunoId).toBe("a1");
    });

    it("normaliza plano embedded", () => {
      const result = normalizeMatriculaApiResponse({
        id: "m1",
        tenantId: "t1",
        plano: {
          id: "p1",
          nome: "Plano",
          valor: 100,
        } as never,
      });
      expect(result.plano?.id).toBe("p1");
      expect(result.plano?.valor).toBe(100);
    });

    it("normaliza pagamento embedded", () => {
      const result = normalizeMatriculaApiResponse({
        id: "m1",
        pagamento: {
          id: "pg1",
          status: "PAGO",
          valorFinal: 199.9,
          dataVencimento: "2026-04-15",
        } as never,
      });
      expect(result.pagamento?.id).toBe("pg1");
      expect(result.pagamento?.valorFinal).toBe(199.9);
    });

    it("ignora pagamento sem id", () => {
      const result = normalizeMatriculaApiResponse({
        id: "m1",
        pagamento: { valorFinal: 100 } as never,
      });
      expect(result.pagamento).toBeUndefined();
    });

    it("toBoolean aceita strings", () => {
      const r1 = normalizeMatriculaApiResponse({
        id: "m1",
        renovacaoAutomatica: "true",
      });
      expect(r1.renovacaoAutomatica).toBe(true);

      const r2 = normalizeMatriculaApiResponse({
        id: "m1",
        renovacaoAutomatica: "sim",
      });
      expect(r2.renovacaoAutomatica).toBe(true);

      const r3 = normalizeMatriculaApiResponse({
        id: "m1",
        renovacaoAutomatica: "nao",
      });
      expect(r3.renovacaoAutomatica).toBe(false);
    });

    it("toBoolean aceita number", () => {
      const result = normalizeMatriculaApiResponse({
        id: "m1",
        renovacaoAutomatica: 1,
      });
      expect(result.renovacaoAutomatica).toBe(true);
    });

    it("contratoStatus fallback para contratoAdesaoStatus", () => {
      const result = normalizeMatriculaApiResponse({
        id: "m1",
        contratoAdesaoStatus: "ASSINADO",
      });
      expect(result.contratoStatus).toBe("ASSINADO");
    });
  });

  describe("listMatriculasApi", () => {
    it("tenta /adesoes primeiro", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue([{ id: "m1" }] as never);
      const result = await listMatriculasApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/comercial/adesoes");
      expect(result).toHaveLength(1);
    });

    it("fallback para /matriculas em 404", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockRejectedValueOnce(
          new ApiRequestError({ status: 404, message: "Not Found" }),
        )
        .mockResolvedValueOnce([{ id: "m1" }] as never);
      await listMatriculasApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/comercial/adesoes");
      expect(spy.mock.calls[1][0].path).toBe("/api/v1/comercial/matriculas");
    });

    it("propaga erro não-fallback", async () => {
      vi.spyOn(http, "apiRequest").mockRejectedValue(
        new ApiRequestError({ status: 500, message: "Server error" }),
      );
      await expect(listMatriculasApi({ tenantId: "t1" })).rejects.toThrow();
    });

    it("fallback 405 e 501", async () => {
      vi.spyOn(http, "apiRequest")
        .mockRejectedValueOnce(
          new ApiRequestError({ status: 405, message: "Method Not Allowed" }),
        )
        .mockResolvedValueOnce([] as never);
      await listMatriculasApi({ tenantId: "t1" });
    });
  });

  describe("listMatriculasPageApi", () => {
    it("retorna paginação com headers", async () => {
      vi.spyOn(http, "apiRequestWithMeta").mockResolvedValue({
        data: [{ id: "m1" }],
        headers: {
          "x-page": "1",
          "x-size": "20",
          "x-total-count": "50",
          "x-total-pages": "3",
        },
      } as never);
      const result = await listMatriculasPageApi({
        tenantId: "t1",
        page: 1,
        size: 20,
      });
      expect(result.page).toBe(1);
      expect(result.size).toBe(20);
      expect(result.total).toBe(50);
      expect(result.hasNext).toBe(true);
    });

    it("hasNext false quando última página", async () => {
      vi.spyOn(http, "apiRequestWithMeta").mockResolvedValue({
        data: [{ id: "m1" }],
        headers: {
          "x-page": "2",
          "x-size": "20",
          "x-total-pages": "3",
        },
      } as never);
      const result = await listMatriculasPageApi({ tenantId: "t1", page: 2 });
      expect(result.hasNext).toBe(false);
    });

    it("sem headers, usa fallback e calcula via size", async () => {
      vi.spyOn(http, "apiRequestWithMeta").mockResolvedValue({
        data: Array.from({ length: 20 }, (_, i) => ({ id: `m${i}` })),
        headers: {},
      } as never);
      const result = await listMatriculasPageApi({
        tenantId: "t1",
        size: 20,
      });
      expect(result.page).toBe(0);
      expect(result.size).toBe(20);
      expect(result.hasNext).toBe(true);
    });

    it("fallback de path em 404", async () => {
      const spy = vi
        .spyOn(http, "apiRequestWithMeta")
        .mockRejectedValueOnce(
          new ApiRequestError({ status: 404, message: "Not Found" }),
        )
        .mockResolvedValueOnce({ data: [], headers: {} } as never);
      await listMatriculasPageApi({ tenantId: "t1" });
      expect(spy.mock.calls).toHaveLength(2);
    });
  });

  describe("listMatriculasDashboardMensalApi", () => {
    it("normaliza dashboard mensal", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        mes: "2026-04",
        resumo: {
          totalContratos: 10,
          contratosAtivos: 8,
          insight: "Insight do mês",
        },
        carteiraAtivaPorPlano: [
          { planoId: "p1", planoNome: "Plano A", quantidade: 5, valor: 500 },
        ],
        contratos: {
          items: [{ id: "m1" }],
          page: 0,
          size: 20,
          totalItems: 1,
          totalPages: 1,
        },
      } as never);
      const result = await listMatriculasDashboardMensalApi({
        tenantId: "t1",
        mes: "2026-04",
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/matriculas/dashboard-mensal",
      );
      expect(result.mes).toBe("2026-04");
      expect(result.resumo.totalContratos).toBe(10);
      expect(result.resumo.insight).toBe("Insight do mês");
      expect(result.carteiraAtivaPorPlano).toHaveLength(1);
      expect(result.contratos.items).toHaveLength(1);
    });

    it("usa defaults para resumo null", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        mes: null,
        resumo: null,
        carteiraAtivaPorPlano: null,
        contratos: null,
      } as never);
      const result = await listMatriculasDashboardMensalApi({
        tenantId: "t1",
        mes: "2026-04",
      });
      expect(result.mes).toBe("");
      expect(result.resumo.totalContratos).toBe(0);
      expect(result.resumo.insight).toContain("Nenhum insight");
      expect(result.carteiraAtivaPorPlano).toEqual([]);
      expect(result.contratos.size).toBe(20);
    });

    it("trim de planoNome vazio vira 'Sem plano'", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        mes: "2026-04",
        carteiraAtivaPorPlano: [{ planoNome: "  " }],
      } as never);
      const result = await listMatriculasDashboardMensalApi({
        tenantId: "t1",
        mes: "2026-04",
      });
      expect(result.carteiraAtivaPorPlano[0].planoNome).toBe("Sem plano");
    });
  });

  describe("listMatriculasByAlunoApi", () => {
    it("usa path com alunoId", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue([] as never);
      await listMatriculasByAlunoApi({ tenantId: "t1", alunoId: "a1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/alunos/a1/adesoes",
      );
    });
  });

  describe("createMatriculaApi", () => {
    it("envia body POST", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "m1" } as never);
      await createMatriculaApi({
        tenantId: "t1",
        data: {
          alunoId: "a1",
          planoId: "p1",
          dataInicio: "2026-04-10",
          valorPago: 199.9,
          formaPagamento: "PIX",
        },
      });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/comercial/matriculas");
      expect(spy.mock.calls[0][0].method).toBe("POST");
      const body = spy.mock.calls[0][0].body as Record<string, unknown>;
      expect(body.alunoId).toBe("a1");
      expect(body.planoId).toBe("p1");
      expect(body.valorPago).toBe(199.9);
    });
  });

  describe("renovarMatriculaApi", () => {
    it("POST /renovar com planoId", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue(undefined as never);
      await renovarMatriculaApi({
        tenantId: "t1",
        id: "m1",
        planoId: "p2",
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/matriculas/m1/renovar",
      );
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].query?.planoId).toBe("p2");
    });
  });

  describe("cancelarMatriculaApi", () => {
    it("POST /cancelar", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue(undefined as never);
      await cancelarMatriculaApi({ tenantId: "t1", id: "m1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/matriculas/m1/cancelar",
      );
      expect(spy.mock.calls[0][0].method).toBe("POST");
    });
  });

  describe("signMatriculaContractApi", () => {
    it("POST /contrato/assinar", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "m1" } as never);
      await signMatriculaContractApi({ tenantId: "t1", id: "m1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/matriculas/m1/contrato/assinar",
      );
    });
  });
});
