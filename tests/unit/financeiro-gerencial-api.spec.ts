import { expect, test } from "@playwright/test";
import {
  cancelarContaPagarApi,
  createContaPagarApi,
  getDreGerencialApi,
  getDreProjecaoApi,
  listContasPagarApi,
  listRegrasRecorrenciaContaPagarApi,
  pagarContaPagarApi,
  updateContaPagarApi,
} from "../../src/lib/api/financeiro-gerencial";
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

function buildRegra(id: string, status: "ATIVA" | "PAUSADA" | "CANCELADA") {
  return {
    id,
    tenantId: "tenant-1",
    tipoContaId: "tipo-1",
    fornecedor: "Fornecedor XPTO",
    documentoFornecedor: null,
    descricao: "Plano de limpeza",
    categoriaOperacional: "FORNECEDORES",
    grupoDre: "DESPESA_OPERACIONAL",
    centroCusto: null,
    valorOriginal: "250.50",
    desconto: "10",
    jurosMulta: "0",
    recorrencia: "MENSAL",
    intervaloDias: null,
    diaDoMes: "5",
    dataInicial: "2026-03-01",
    termino: "APOS_OCORRENCIAS",
    dataFim: null,
    numeroOcorrencias: "6",
    criarLancamentoInicial: true,
    timezone: "America/Sao_Paulo",
    status,
    ultimaGeracaoEm: "2026-03-05T00:00:00Z",
    dataCriacao: "2026-03-01T00:00:00Z",
    dataAtualizacao: "2026-03-05T00:00:00Z",
  };
}

function buildConta(id: string, status: "PENDENTE" | "PAGA" | "CANCELADA") {
  return {
    id,
    tenantId: "tenant-1",
    tipoContaId: "tipo-1",
    regraRecorrenciaId: null,
    fornecedor: "Fornecedor XPTO",
    documentoFornecedor: null,
    descricao: "Mensalidade do fornecedor",
    categoria: "FORNECEDORES",
    grupoDre: "DESPESA_OPERACIONAL",
    centroCusto: null,
    regime: "FIXA",
    competencia: "2026-03-01",
    dataEmissao: "2026-03-01",
    dataVencimento: "2026-03-10",
    dataPagamento: status === "PAGA" ? "2026-03-10" : null,
    valorOriginal: "300",
    desconto: "20",
    jurosMulta: "5",
    valorPago: status === "PAGA" ? "285" : null,
    formaPagamento: status === "PAGA" ? "PIX" : null,
    status,
    geradaAutomaticamente: false,
    origemLancamento: "MANUAL",
    observacoes: status === "CANCELADA" ? "Cancelada pelo usuario" : null,
    dataCriacao: "2026-03-01T00:00:00Z",
    dataAtualizacao: "2026-03-10T00:00:00Z",
  };
}

test.describe("financeiro gerencial api", () => {
  test("normaliza listagem de regras recorrentes", async () => {
    const { calls, restore } = mockFetchWithSequence([
      { body: [buildRegra("regra-1", "ATIVA")] },
    ]);

    try {
      const regras = await listRegrasRecorrenciaContaPagarApi({
        tenantId: "tenant-1",
        status: "TODAS",
      });
      expect(regras[0]?.valorOriginal).toBe(250.5);
      expect(regras[0]?.diaDoMes).toBe(5);
      expect(regras[0]?.numeroOcorrencias).toBe(6);

      expect(calls[0].url).toContain("/api/v1/gerencial/financeiro/regras-recorrencia");
    } finally {
      restore();
    }
  });

  test("normaliza contas a pagar, DRE e projecao financeira", async () => {
    const { calls, restore } = mockFetchWithSequence([
      { body: [buildConta("conta-1", "PENDENTE")] },
      { body: buildConta("conta-2", "PENDENTE") },
      { body: buildConta("conta-2", "PENDENTE") },
      { body: buildConta("conta-2", "PAGA") },
      { body: buildConta("conta-2", "CANCELADA") },
      {
        body: {
          periodoInicio: "2026-03-01",
          periodoFim: "2026-03-31",
          receitaBruta: "10000",
          deducoesReceita: "500",
          receitaLiquida: "9500",
          custosVariaveis: "2000",
          margemContribuicao: "7500",
          despesasOperacionais: "3000",
          ebitda: "4500",
          resultadoLiquido: "4200",
          ticketMedio: "180",
          inadimplencia: "1.7",
          contasReceberEmAberto: "900",
          contasPagarEmAberto: "1200",
          despesasPorGrupo: [{ grupo: "DESPESA_OPERACIONAL", valor: "3000" }],
          despesasPorCategoria: [{ categoria: "FORNECEDORES", valor: "800" }],
          despesasSemTipoCount: "2",
          despesasSemTipoValor: "150",
        },
      },
      {
        body: {
          periodoInicio: "2026-03-01",
          periodoFim: "2026-03-31",
          cenario: "OTIMISTA",
          realizado: {
            receitas: "1000",
            despesas: "400",
            resultado: "600",
            custosVariaveis: "100",
            despesasOperacionais: "200",
            despesasFinanceiras: "50",
            impostos: "50",
          },
          projetado: {
            receitas: "1200",
            despesas: "450",
            resultado: "750",
            custosVariaveis: "110",
            despesasOperacionais: "220",
            despesasFinanceiras: "60",
            impostos: "60",
          },
          consolidado: {
            receitas: "2200",
            despesas: "850",
            resultado: "1350",
            custosVariaveis: "210",
            despesasOperacionais: "420",
            despesasFinanceiras: "110",
            impostos: "110",
          },
          linhas: [
            {
              grupo: "RECEITA_RECURRENTE",
              natureza: "RECEITA",
              realizado: "1000",
              projetado: "1200",
              consolidado: "2200",
            },
          ],
        },
      },
    ]);

    try {
      const contas = await listContasPagarApi({
        tenantId: "tenant-1",
        status: "PENDENTE",
      });
      expect(contas[0]?.valorOriginal).toBe(300);
      expect(contas[0]?.desconto).toBe(20);
      expect(contas[0]?.jurosMulta).toBe(5);

      const created = await createContaPagarApi({
        tenantId: "tenant-1",
        data: {
          fornecedor: "Fornecedor XPTO",
          descricao: "Conta manual",
          competencia: "2026-03-01",
          dataVencimento: "2026-03-10",
          valorOriginal: 300,
          recorrencia: {
            tipo: "MENSAL",
            dataInicial: "2026-03-01",
            termino: "SEM_FIM",
            criarLancamentoInicial: true,
          },
        },
      });
      expect(created?.status).toBe("PENDENTE");

      const updated = await updateContaPagarApi({
        tenantId: "tenant-1",
        id: "conta-2",
        data: {
          descricao: "Conta atualizada",
        },
      });
      expect(updated.id).toBe("conta-2");

      const paid = await pagarContaPagarApi({
        tenantId: "tenant-1",
        id: "conta-2",
        data: {
          dataPagamento: "2026-03-10",
          formaPagamento: "PIX",
          valorPago: 285,
        },
      });
      expect(paid.status).toBe("PAGA");
      expect(paid.valorPago).toBe(285);

      const canceled = await cancelarContaPagarApi({
        tenantId: "tenant-1",
        id: "conta-2",
        observacoes: "Sem necessidade",
      });
      expect(canceled.status).toBe("CANCELADA");
      expect(calls[4].body).toContain("Sem necessidade");

      const dre = await getDreGerencialApi({
        tenantId: "tenant-1",
        month: 3,
        year: 2026,
      });
      expect(dre.receitaLiquida).toBe(9500);
      expect(dre.despesasPorGrupo[0]?.valor).toBe(3000);
      expect(dre.despesasSemTipoCount).toBe(2);

      const dreProjecao = await getDreProjecaoApi({
        tenantId: "tenant-1",
        cenario: "OTIMISTA",
      });
      expect(dreProjecao.cenario).toBe("OTIMISTA");
      expect(dreProjecao.consolidado.resultado).toBe(1350);
      expect(dreProjecao.linhas[0]?.consolidado).toBe(2200);

      expect(calls[0].url).toContain("/api/v1/gerencial/financeiro/contas-pagar");
      expect(calls[1].method).toBe("POST");
      expect(calls[2].url).toContain("/api/v1/gerencial/financeiro/contas-pagar/conta-2");
      expect(calls[3].url).toContain("/api/v1/gerencial/financeiro/contas-pagar/conta-2/pagar");
      expect(calls[5].url).toContain("/api/v1/gerencial/financeiro/dre");
      expect(calls[6].url).toContain("/api/v1/gerencial/financeiro/dre/projecao");
    } finally {
      restore();
    }
  });
});
