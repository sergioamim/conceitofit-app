import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cancelarContaPagarApi,
  createContaPagarApi,
  getDreGerencialApi,
  getDreProjecaoApi,
  listContasPagarApi,
  listRegrasRecorrenciaContaPagarApi,
  pagarContaPagarApi,
  updateContaPagarApi,
} from "@/lib/api/financeiro-gerencial";
import * as http from "@/lib/api/http";

describe("api/financeiro-gerencial", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("listRegrasRecorrenciaContaPagarApi", () => {
    it("GET /regras-recorrencia e normaliza", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([
        {
          id: "r1",
          tenantId: "t1",
          tipoContaId: "tc1",
          fornecedor: "F",
          descricao: "D",
          categoriaOperacional: "FIXA",
          grupoDre: "CUSTOS_FIXOS",
          valorOriginal: "100",
          desconto: "0",
          jurosMulta: "0",
          recorrencia: "MENSAL",
          intervaloDias: null,
          diaDoMes: 5,
          dataInicial: "2026-04-01",
          termino: "INDETERMINADO",
          criarLancamentoInicial: true,
          status: "ATIVA",
          dataCriacao: "2026-04-01",
        },
      ] as never);
      const result = await listRegrasRecorrenciaContaPagarApi({
        tenantId: "t1",
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/gerencial/financeiro/regras-recorrencia",
      );
      expect(result[0].valorOriginal).toBe(100);
      expect(result[0].diaDoMes).toBe(5);
      expect(result[0].criarLancamentoInicial).toBe(true);
    });

    it("normaliza intervaloDias mínimo 1", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        {
          id: "r1",
          tenantId: "t1",
          tipoContaId: "tc1",
          fornecedor: "F",
          descricao: "D",
          categoriaOperacional: "FIXA",
          grupoDre: "CUSTOS_FIXOS",
          valorOriginal: 100,
          desconto: 0,
          jurosMulta: 0,
          recorrencia: "DIARIA",
          intervaloDias: 0,
          dataInicial: "2026-04-01",
          termino: "INDETERMINADO",
          criarLancamentoInicial: false,
          status: "ATIVA",
          dataCriacao: "2026-04-01",
        },
      ] as never);
      const result = await listRegrasRecorrenciaContaPagarApi({
        tenantId: "t1",
      });
      expect(result[0].intervaloDias).toBe(1);
    });
  });

  describe("listContasPagarApi", () => {
    it("GET com filtros e normaliza", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([
        {
          id: "cp1",
          tenantId: "t1",
          fornecedor: "F",
          descricao: "D",
          categoria: "FIXA",
          regime: "COMPETENCIA",
          competencia: "2026-04",
          dataVencimento: "2026-04-10",
          valorOriginal: "200",
          desconto: "10",
          jurosMulta: "0",
          valorPago: "190",
          status: "PAGA",
          geradaAutomaticamente: true,
          dataCriacao: "2026-04-01",
        },
      ] as never);
      const result = await listContasPagarApi({
        tenantId: "t1",
        status: "PAGA",
        grupoDre: "CUSTOS_FIXOS" as never,
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/gerencial/financeiro/contas-pagar",
      );
      expect(result[0].valorOriginal).toBe(200);
      expect(result[0].valorPago).toBe(190);
    });

    it("valorPago null → undefined", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        {
          id: "cp1",
          tenantId: "t1",
          fornecedor: "F",
          descricao: "D",
          categoria: "FIXA",
          regime: "COMPETENCIA",
          competencia: "2026-04",
          dataVencimento: "2026-04-10",
          valorOriginal: 100,
          desconto: 0,
          jurosMulta: 0,
          valorPago: null,
          status: "PENDENTE",
          geradaAutomaticamente: false,
          dataCriacao: "2026-04-01",
        },
      ] as never);
      const result = await listContasPagarApi({ tenantId: "t1" });
      expect(result[0].valorPago).toBeUndefined();
    });
  });

  describe("createContaPagarApi", () => {
    it("POST normaliza", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "cp1",
        tenantId: "t1",
        fornecedor: "F",
        descricao: "D",
        categoria: "VARIAVEL",
        regime: "CAIXA",
        competencia: "2026-04",
        dataVencimento: "2026-04-10",
        valorOriginal: 100,
        desconto: 0,
        jurosMulta: 0,
        status: "PENDENTE",
        geradaAutomaticamente: false,
        dataCriacao: "2026-04-01",
      } as never);
      const result = await createContaPagarApi({
        tenantId: "t1",
        data: {
          fornecedor: "F",
          descricao: "D",
          competencia: "2026-04",
          dataVencimento: "2026-04-10",
          valorOriginal: 100,
        },
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(result?.valorOriginal).toBe(100);
    });

    it("null response → null", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue(null as never);
      const result = await createContaPagarApi({
        tenantId: "t1",
        data: {
          fornecedor: "F",
          descricao: "D",
          competencia: "2026-04",
          dataVencimento: "2026-04-10",
          valorOriginal: 100,
        },
      });
      expect(result).toBeNull();
    });
  });

  describe("updateContaPagarApi", () => {
    it("PUT /{id}", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "cp1",
        tenantId: "t1",
        fornecedor: "F",
        descricao: "D",
        categoria: "FIXA",
        regime: "COMPETENCIA",
        competencia: "2026-04",
        dataVencimento: "2026-04-10",
        valorOriginal: 100,
        desconto: 0,
        jurosMulta: 0,
        status: "PENDENTE",
        geradaAutomaticamente: false,
        dataCriacao: "2026-04-01",
      } as never);
      await updateContaPagarApi({
        tenantId: "t1",
        id: "cp1",
        data: { descricao: "Edit" },
      });
      expect(spy.mock.calls[0][0].method).toBe("PUT");
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/gerencial/financeiro/contas-pagar/cp1",
      );
    });
  });

  describe("pagarContaPagarApi", () => {
    it("PATCH /pagar", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "cp1",
        tenantId: "t1",
        fornecedor: "F",
        descricao: "D",
        categoria: "FIXA",
        regime: "COMPETENCIA",
        competencia: "2026-04",
        dataVencimento: "2026-04-10",
        valorOriginal: 100,
        desconto: 0,
        jurosMulta: 0,
        status: "PAGA",
        geradaAutomaticamente: false,
        dataCriacao: "2026-04-01",
      } as never);
      await pagarContaPagarApi({
        tenantId: "t1",
        id: "cp1",
        data: { dataPagamento: "2026-04-10", formaPagamento: "PIX" },
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/gerencial/financeiro/contas-pagar/cp1/pagar",
      );
      expect(spy.mock.calls[0][0].method).toBe("PATCH");
    });
  });

  describe("cancelarContaPagarApi", () => {
    it("PATCH /cancelar com observacoes", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "cp1",
        tenantId: "t1",
        fornecedor: "F",
        descricao: "D",
        categoria: "FIXA",
        regime: "COMPETENCIA",
        competencia: "2026-04",
        dataVencimento: "2026-04-10",
        valorOriginal: 100,
        desconto: 0,
        jurosMulta: 0,
        status: "CANCELADA",
        geradaAutomaticamente: false,
        dataCriacao: "2026-04-01",
      } as never);
      await cancelarContaPagarApi({
        tenantId: "t1",
        id: "cp1",
        observacoes: "motivo",
      });
      expect(spy.mock.calls[0][0].body).toEqual({ observacoes: "motivo" });
    });

    it("sem observacoes → body undefined", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "cp1",
        tenantId: "t1",
        fornecedor: "F",
        descricao: "D",
        categoria: "FIXA",
        regime: "COMPETENCIA",
        competencia: "2026-04",
        dataVencimento: "2026-04-10",
        valorOriginal: 100,
        desconto: 0,
        jurosMulta: 0,
        status: "CANCELADA",
        geradaAutomaticamente: false,
        dataCriacao: "2026-04-01",
      } as never);
      await cancelarContaPagarApi({ tenantId: "t1", id: "cp1" });
      expect(spy.mock.calls[0][0].body).toBeUndefined();
    });
  });

  describe("getDreGerencialApi", () => {
    it("GET /dre e normaliza", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        periodoInicio: "2026-04-01",
        periodoFim: "2026-04-30",
        receitaBruta: "10000",
        deducoesReceita: "500",
        receitaLiquida: "9500",
        custosVariaveis: "2000",
        margemContribuicao: "7500",
        despesasOperacionais: "3000",
        ebitda: "4500",
        resultadoLiquido: "3500",
        ticketMedio: "199",
        inadimplencia: "100",
        contasReceberEmAberto: "500",
        contasPagarEmAberto: "200",
        despesasPorGrupo: [
          { grupo: "CUSTOS_FIXOS", valor: "1000" },
        ],
        despesasPorCategoria: [
          { categoria: "FIXA", valor: "1500" },
        ],
        despesasSemTipoCount: 2,
        despesasSemTipoValor: "300",
      } as never);
      const result = await getDreGerencialApi({
        tenantId: "t1",
        month: 4,
        year: 2026,
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/gerencial/financeiro/dre",
      );
      expect(result.receitaBruta).toBe(10000);
      expect(result.ebitda).toBe(4500);
      expect(result.despesasPorGrupo[0].valor).toBe(1000);
    });

    it("despesasPorGrupo ausentes → []", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        periodoInicio: "2026-04-01",
        periodoFim: "2026-04-30",
        receitaBruta: 100,
      } as never);
      const result = await getDreGerencialApi({ tenantId: "t1" });
      expect(result.despesasPorGrupo).toEqual([]);
      expect(result.despesasPorCategoria).toEqual([]);
    });
  });

  describe("getDreProjecaoApi", () => {
    it("GET /dre/projecao e normaliza", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        periodoInicio: "2026-04-01",
        periodoFim: "2026-04-30",
        cenario: "REALISTA",
        realizado: {
          receitas: 1000,
          despesas: 500,
          resultado: 500,
          custosVariaveis: 200,
          despesasOperacionais: 200,
          despesasFinanceiras: 50,
          impostos: 50,
        },
        projetado: {
          receitas: 2000,
          despesas: 1000,
          resultado: 1000,
          custosVariaveis: 400,
          despesasOperacionais: 400,
          despesasFinanceiras: 100,
          impostos: 100,
        },
        consolidado: {
          receitas: 3000,
          despesas: 1500,
          resultado: 1500,
          custosVariaveis: 600,
          despesasOperacionais: 600,
          despesasFinanceiras: 150,
          impostos: 150,
        },
        linhas: [
          {
            grupo: "Receita de serviços",
            natureza: "RECEITA",
            realizado: 1000,
            projetado: 2000,
            consolidado: 3000,
          },
        ],
      } as never);
      const result = await getDreProjecaoApi({
        tenantId: "t1",
        cenario: "REALISTA" as never,
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/gerencial/financeiro/dre/projecao",
      );
      expect(result.realizado.receitas).toBe(1000);
      expect(result.projetado.resultado).toBe(1000);
      expect(result.consolidado.receitas).toBe(3000);
      expect(result.linhas).toHaveLength(1);
    });

    it("linhas null → []", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        periodoInicio: "2026-04-01",
        periodoFim: "2026-04-30",
        cenario: "BASE",
        realizado: {
          receitas: 0, despesas: 0, resultado: 0, custosVariaveis: 0,
          despesasOperacionais: 0, despesasFinanceiras: 0, impostos: 0,
        },
        projetado: {
          receitas: 0, despesas: 0, resultado: 0, custosVariaveis: 0,
          despesasOperacionais: 0, despesasFinanceiras: 0, impostos: 0,
        },
        consolidado: {
          receitas: 0, despesas: 0, resultado: 0, custosVariaveis: 0,
          despesasOperacionais: 0, despesasFinanceiras: 0, impostos: 0,
        },
        linhas: null,
      } as never);
      const result = await getDreProjecaoApi({ tenantId: "t1" });
      expect(result.linhas).toEqual([]);
    });
  });
});
