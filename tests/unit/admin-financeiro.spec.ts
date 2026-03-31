import { expect, test } from "@playwright/test";
import {
  buildNfseChecklist,
  summarizeAgregadorTransacoes,
  summarizeIntegracoesOperacionais,
  summarizeRecebimentosOperacionais,
  validateNfseConfiguracaoDraft,
} from "../../src/lib/backoffice/admin-financeiro";
import type { AgregadorTransacao, IntegracaoOperacional, Pagamento } from "../../src/lib/types";

test.describe("admin financeiro helpers", () => {
  test("validateNfseConfiguracaoDraft exige campos obrigatórios", async () => {
    expect(
      validateNfseConfiguracaoDraft({
        prefeitura: "",
        inscricaoMunicipal: "",
        cnaePrincipal: "",
        codigoTributacaoNacional: "",
        codigoNbs: "",
        serieRps: "",
        loteInicial: 0,
        aliquotaPadrao: 0,
      })
    ).toEqual({
      prefeitura: "Informe a prefeitura emissora.",
      inscricaoMunicipal: "Informe a inscrição municipal.",
      cnaePrincipal: "Informe o CNAE principal.",
      codigoTributacaoNacional: "Informe o código de tributação nacional.",
      codigoNbs: "Informe o código NBS.",
      serieRps: "Informe a série do RPS.",
      provedor: "Selecione o provedor fiscal.",
      classificacaoTributaria: "Selecione a classificação tributária.",
      indicadorOperacao: "Selecione o indicador da operação.",
      loteInicial: "Lote inicial deve ser maior que zero.",
      aliquotaPadrao: "Informe uma alíquota válida.",
    });
  });

  test("buildNfseChecklist marca etapas básicas concluídas", async () => {
    const checklist = buildNfseChecklist({
      prefeitura: "Rio de Janeiro",
      inscricaoMunicipal: "123",
      cnaePrincipal: "9313-1/00",
      codigoTributacaoNacional: "1301",
      codigoNbs: "1.1301.25.00",
      classificacaoTributaria: "SERVICO_TRIBUTAVEL",
      indicadorOperacao: "SERVICO_MUNICIPIO",
      serieRps: "S1",
      provedor: "GINFES",
      ambiente: "HOMOLOGACAO",
      loteInicial: 1,
      aliquotaPadrao: 2.5,
      webhookFiscalUrl: "https://hooks.example.test/fiscal",
    });

    expect(checklist.every((item) => item.done)).toBeTruthy();
    expect(checklist.find((item) => item.id === "cadastro-fiscal")?.done).toBeTruthy();
    expect(checklist.find((item) => item.id === "reforma-tributaria")?.done).toBeTruthy();
  });

  test("summarizeAgregadorTransacoes consolida repasses e divergências", async () => {
    const transacoes: AgregadorTransacao[] = [
      {
        id: "agt-1",
        tenantId: "tenant-1",
        adquirente: "STONE",
        nsu: "1",
        bandeira: "Visa",
        meioCaptura: "POS",
        clienteNome: "Cliente A",
        descricao: "Plano A",
        valorBruto: 100,
        taxa: 3,
        valorLiquido: 97,
        parcelas: 1,
        dataTransacao: "2026-03-10T10:00:00",
        dataPrevistaRepasse: "2026-03-11",
        statusTransacao: "CAPTURADA",
        statusRepasse: "LIQUIDADO",
        statusConciliacao: "CONCILIADA",
      },
      {
        id: "agt-2",
        tenantId: "tenant-1",
        adquirente: "STONE",
        nsu: "2",
        bandeira: "Visa",
        meioCaptura: "POS",
        clienteNome: "Cliente B",
        descricao: "Plano B",
        valorBruto: 80,
        taxa: 2,
        valorLiquido: 78,
        parcelas: 1,
        dataTransacao: "2026-03-10T10:00:00",
        dataPrevistaRepasse: "2026-03-11",
        statusTransacao: "CAPTURADA",
        statusRepasse: "DIVERGENTE",
        statusConciliacao: "DIVERGENTE",
      },
    ];

    expect(summarizeAgregadorTransacoes(transacoes)).toEqual({
      totalBruto: 180,
      totalLiquido: 175,
      totalLiquidado: 97,
      totalEmAberto: 0,
      divergencias: 1,
    });
  });

  test("summarizeRecebimentosOperacionais considera NFSe pendente e repasse divergente", async () => {
    const pagamentos: Pagamento[] = [
      {
        id: "pg-1",
        tenantId: "tenant-1",
        alunoId: "al-1",
        tipo: "MENSALIDADE",
        descricao: "Plano A",
        valor: 100,
        desconto: 0,
        valorFinal: 100,
        dataVencimento: "2026-03-10",
        dataPagamento: "2026-03-10",
        status: "PAGO",
        dataCriacao: "2026-03-10T10:00:00",
      },
      {
        id: "pg-2",
        tenantId: "tenant-1",
        alunoId: "al-1",
        tipo: "MENSALIDADE",
        descricao: "Plano B",
        valor: 90,
        desconto: 0,
        valorFinal: 90,
        dataVencimento: "2026-03-09",
        status: "VENCIDO",
        dataCriacao: "2026-03-09T10:00:00",
      },
    ];

    const transacoes: AgregadorTransacao[] = [
      {
        id: "agt-1",
        tenantId: "tenant-1",
        pagamentoId: "pg-1",
        adquirente: "STONE",
        nsu: "1",
        bandeira: "Visa",
        meioCaptura: "POS",
        clienteNome: "Cliente A",
        descricao: "Plano A",
        valorBruto: 100,
        taxa: 3,
        valorLiquido: 97,
        parcelas: 1,
        dataTransacao: "2026-03-10T10:00:00",
        dataPrevistaRepasse: "2026-03-11",
        statusTransacao: "CAPTURADA",
        statusRepasse: "DIVERGENTE",
        statusConciliacao: "DIVERGENTE",
      },
    ];

    expect(summarizeRecebimentosOperacionais(pagamentos, transacoes)).toEqual({
      recebido: 100,
      emAberto: 90,
      inadimplencia: 90,
      nfsePendente: 1,
      repasseDivergente: 1,
    });
  });

  test("summarizeIntegracoesOperacionais agrupa status e fila", async () => {
    const integracoes: IntegracaoOperacional[] = [
      {
        id: "int-1",
        tenantId: "tenant-1",
        nome: "NFSe",
        tipo: "NFSE",
        fornecedor: "GINFES",
        status: "SAUDAVEL",
        filaPendente: 0,
        ocorrencias: [],
      },
      {
        id: "int-2",
        tenantId: "tenant-1",
        nome: "Webhook",
        tipo: "WEBHOOK",
        fornecedor: "Hub",
        status: "FALHA",
        filaPendente: 5,
        ocorrencias: [],
      },
    ];

    expect(summarizeIntegracoesOperacionais(integracoes)).toEqual({
      total: 2,
      saudavel: 1,
      atencao: 0,
      falha: 1,
      configuracaoPendente: 0,
      filaPendente: 5,
    });
  });
});
