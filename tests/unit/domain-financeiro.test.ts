import { describe, expect, it } from "vitest";
import {
  AGREGADOR_REPASSE_LABEL,
  INTEGRACAO_STATUS_LABEL,
  NFSE_CLASSIFICACAO_TRIBUTARIA_LABEL,
  NFSE_INDICADOR_OPERACAO_LABEL,
  NFSE_STATUS_LABEL,
  buildNfseChecklist,
  getNfseBloqueioMensagem,
  summarizeAgregadorTransacoes,
  summarizeIntegracoesOperacionais,
  summarizeRecebimentosOperacionais,
  validateNfseConfiguracaoDraft,
} from "@/lib/domain/financeiro";
import {
  isCobrancaEmAberto,
  isCobrancaPendente,
  isContaPagarEmAberto,
  isContaPagarPendente,
  isPagamentoEmAberto,
} from "@/lib/domain/status-helpers";

describe("domain/financeiro — labels e validação NFS-e", () => {
  describe("labels", () => {
    it("NFSE_STATUS_LABEL cobre todos os status", () => {
      expect(NFSE_STATUS_LABEL.PENDENTE).toBe("Pendente");
      expect(NFSE_STATUS_LABEL.CONFIGURADA).toBe("Configurada");
      expect(NFSE_STATUS_LABEL.ERRO).toBe("Com erro");
    });

    it("NFSE_INDICADOR_OPERACAO_LABEL tem PRESENCIAL/NAO_PRESENCIAL (Task #557)", () => {
      expect(NFSE_INDICADOR_OPERACAO_LABEL.PRESENCIAL).toBe("Presencial");
      expect(NFSE_INDICADOR_OPERACAO_LABEL.NAO_PRESENCIAL).toBe("Não presencial");
    });

    it("AGREGADOR_REPASSE_LABEL tem todos os status de repasse", () => {
      expect(AGREGADOR_REPASSE_LABEL.PREVISTO).toBe("Previsto");
      expect(AGREGADOR_REPASSE_LABEL.EM_TRANSITO).toBe("Em trânsito");
      expect(AGREGADOR_REPASSE_LABEL.LIQUIDADO).toBe("Liquidado");
      expect(AGREGADOR_REPASSE_LABEL.DIVERGENTE).toBe("Divergente");
    });

    it("INTEGRACAO_STATUS_LABEL cobre todos os estados", () => {
      expect(INTEGRACAO_STATUS_LABEL.SAUDAVEL).toBe("Saudável");
      expect(INTEGRACAO_STATUS_LABEL.FALHA).toBe("Falha");
      expect(INTEGRACAO_STATUS_LABEL.CONFIGURACAO_PENDENTE).toBe(
        "Configuração pendente",
      );
    });

    it("NFSE_CLASSIFICACAO_TRIBUTARIA_LABEL cobre todos os valores", () => {
      expect(NFSE_CLASSIFICACAO_TRIBUTARIA_LABEL.SERVICO_TRIBUTAVEL).toBe(
        "Serviço tributável",
      );
      expect(NFSE_CLASSIFICACAO_TRIBUTARIA_LABEL.ISENTO).toBe("Isento");
    });
  });

  describe("getNfseBloqueioMensagem", () => {
    it("retorna null para input null/undefined", () => {
      expect(getNfseBloqueioMensagem(null)).toBeNull();
      expect(getNfseBloqueioMensagem(undefined)).toBeNull();
    });

    it("retorna null para status CONFIGURADA", () => {
      expect(getNfseBloqueioMensagem({ status: "CONFIGURADA" })).toBeNull();
    });

    it("retorna erro customizado quando ultimoErro presente", () => {
      const msg = getNfseBloqueioMensagem({
        status: "ERRO",
        ultimoErro: "certificado expirado",
      });
      expect(msg).toContain("certificado expirado");
    });

    it("retorna mensagem padrão para PENDENTE sem erro", () => {
      const msg = getNfseBloqueioMensagem({ status: "PENDENTE" });
      expect(msg).toMatch(/bloqueada/i);
    });

    it("ignora ultimoErro vazio/whitespace", () => {
      const msg = getNfseBloqueioMensagem({
        status: "ERRO",
        ultimoErro: "   ",
      });
      expect(msg).toMatch(/bloqueada/i);
    });
  });

  describe("validateNfseConfiguracaoDraft", () => {
    it("retorna erros para todos os campos obrigatórios ausentes", () => {
      const errors = validateNfseConfiguracaoDraft({});
      expect(errors.prefeitura).toBeTruthy();
      expect(errors.inscricaoMunicipal).toBeTruthy();
      expect(errors.cnaePrincipal).toBeTruthy();
      expect(errors.codigoTributacaoNacional).toBeTruthy();
      expect(errors.codigoNbs).toBeTruthy();
      expect(errors.serieRps).toBeTruthy();
      expect(errors.provedor).toBeTruthy();
      expect(errors.classificacaoTributaria).toBeTruthy();
      expect(errors.indicadorOperacao).toBeTruthy();
    });

    it("retorna erros de loteInicial quando zero ou negativo", () => {
      const errors = validateNfseConfiguracaoDraft({ loteInicial: 0 });
      expect(errors.loteInicial).toBeTruthy();
    });

    it("retorna erros de aliquota quando zero", () => {
      const errors = validateNfseConfiguracaoDraft({ aliquotaPadrao: 0 });
      expect(errors.aliquotaPadrao).toBeTruthy();
    });

    it("aceita draft completo válido", () => {
      const errors = validateNfseConfiguracaoDraft({
        prefeitura: "Rio",
        inscricaoMunicipal: "123",
        cnaePrincipal: "9313-1/00",
        codigoTributacaoNacional: "1301",
        codigoNbs: "1.1301",
        serieRps: "S1",
        provedor: "SEFIN_NACIONAL",
        classificacaoTributaria: "SERVICO_TRIBUTAVEL",
        indicadorOperacao: "PRESENCIAL",
        loteInicial: 1,
        aliquotaPadrao: 2.5,
      });
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe("buildNfseChecklist", () => {
    it("retorna 4 itens", () => {
      const items = buildNfseChecklist({});
      expect(items).toHaveLength(4);
      expect(items.map((i) => i.id)).toEqual([
        "cadastro-fiscal",
        "reforma-tributaria",
        "parametros-rps",
        "integracao",
      ]);
    });

    it("todos os itens done=false para input vazio", () => {
      const items = buildNfseChecklist({});
      expect(items.every((i) => !i.done)).toBe(true);
    });

    it("cadastro-fiscal done quando prefeitura/inscr/cnae presentes", () => {
      const items = buildNfseChecklist({
        prefeitura: "Rio",
        inscricaoMunicipal: "123",
        cnaePrincipal: "9313",
      });
      expect(items.find((i) => i.id === "cadastro-fiscal")?.done).toBe(true);
    });

    it("integracao done exige provedor + ambiente + webhookFiscalUrl", () => {
      expect(
        buildNfseChecklist({
          provedor: "SEFIN_NACIONAL",
          ambiente: "HOMOLOGACAO",
          webhookFiscalUrl: "https://hook",
        }).find((i) => i.id === "integracao")?.done,
      ).toBe(true);

      // Sem webhook → false
      expect(
        buildNfseChecklist({
          provedor: "SEFIN_NACIONAL",
          ambiente: "HOMOLOGACAO",
        }).find((i) => i.id === "integracao")?.done,
      ).toBe(false);
    });
  });

  describe("summarizeAgregadorTransacoes", () => {
    it("soma totais corretamente", () => {
      const result = summarizeAgregadorTransacoes([
        {
          valorBruto: 100,
          valorLiquido: 95,
          statusRepasse: "LIQUIDADO",
          statusConciliacao: "CONCILIADA",
        },
        {
          valorBruto: 200,
          valorLiquido: 190,
          statusRepasse: "PREVISTO",
          statusConciliacao: "PENDENTE",
        },
        {
          valorBruto: 300,
          valorLiquido: 280,
          statusRepasse: "DIVERGENTE",
          statusConciliacao: "PENDENTE",
        },
      ] as never);

      expect(result.totalBruto).toBe(600);
      expect(result.totalLiquido).toBe(565);
      expect(result.totalLiquidado).toBe(95);
      expect(result.totalEmAberto).toBe(190);
      expect(result.divergencias).toBe(1);
    });

    it("trata array vazio", () => {
      const result = summarizeAgregadorTransacoes([]);
      expect(result.totalBruto).toBe(0);
      expect(result.divergencias).toBe(0);
    });

    it("conta divergência quando statusConciliacao=DIVERGENTE também", () => {
      const result = summarizeAgregadorTransacoes([
        {
          valorBruto: 100,
          valorLiquido: 100,
          statusRepasse: "LIQUIDADO",
          statusConciliacao: "DIVERGENTE",
        },
      ] as never);
      expect(result.divergencias).toBe(1);
    });
  });

  describe("summarizeRecebimentosOperacionais", () => {
    it("soma pagamentos por status", () => {
      const result = summarizeRecebimentosOperacionais(
        [
          { id: "1", status: "PAGO", valorFinal: 100, nfseEmitida: true },
          { id: "2", status: "PENDENTE", valor: 200 },
          { id: "3", status: "VENCIDO", valor: 300 },
          { id: "4", status: "PAGO", valorFinal: 400, nfseEmitida: false },
        ] as never,
        [],
      );
      expect(result.recebido).toBe(500);
      expect(result.emAberto).toBe(500); // 200 + 300
      expect(result.inadimplencia).toBe(300);
      expect(result.nfsePendente).toBe(1);
    });

    it("marca repasse divergente por pagamentoId", () => {
      const result = summarizeRecebimentosOperacionais(
        [{ id: "p1", status: "PAGO", valorFinal: 100 }] as never,
        [{ pagamentoId: "p1", statusRepasse: "DIVERGENTE" }] as never,
      );
      expect(result.repasseDivergente).toBe(1);
    });
  });

  describe("summarizeIntegracoesOperacionais", () => {
    it("contabiliza por status", () => {
      const result = summarizeIntegracoesOperacionais([
        { status: "SAUDAVEL", filaPendente: 1 },
        { status: "ATENCAO", filaPendente: 2 },
        { status: "FALHA", filaPendente: 3 },
        { status: "CONFIGURACAO_PENDENTE", filaPendente: 0 },
      ] as never);
      expect(result.total).toBe(4);
      expect(result.saudavel).toBe(1);
      expect(result.atencao).toBe(1);
      expect(result.falha).toBe(1);
      expect(result.configuracaoPendente).toBe(1);
      expect(result.filaPendente).toBe(6);
    });
  });
});

describe("domain/status-helpers — predicates", () => {
  describe("isPagamentoEmAberto", () => {
    it("true para PENDENTE e VENCIDO", () => {
      expect(isPagamentoEmAberto("PENDENTE")).toBe(true);
      expect(isPagamentoEmAberto("VENCIDO")).toBe(true);
    });
    it("false para PAGO e CANCELADO", () => {
      expect(isPagamentoEmAberto("PAGO")).toBe(false);
      expect(isPagamentoEmAberto("CANCELADO")).toBe(false);
    });
  });

  describe("isCobrancaEmAberto / isCobrancaPendente", () => {
    it("isCobrancaEmAberto true para PENDENTE/VENCIDO", () => {
      expect(isCobrancaEmAberto("PENDENTE")).toBe(true);
      expect(isCobrancaEmAberto("VENCIDO")).toBe(true);
      expect(isCobrancaEmAberto("PAGO")).toBe(false);
    });

    it("isCobrancaPendente só PENDENTE", () => {
      expect(isCobrancaPendente("PENDENTE")).toBe(true);
      expect(isCobrancaPendente("VENCIDO")).toBe(false);
    });
  });

  describe("isContaPagarEmAberto / isContaPagarPendente", () => {
    it("isContaPagarEmAberto true para PENDENTE/VENCIDA", () => {
      expect(isContaPagarEmAberto("PENDENTE")).toBe(true);
      expect(isContaPagarEmAberto("VENCIDA")).toBe(true);
      expect(isContaPagarEmAberto("PAGA")).toBe(false);
      expect(isContaPagarEmAberto("CANCELADA")).toBe(false);
    });

    it("isContaPagarPendente só PENDENTE", () => {
      expect(isContaPagarPendente("PENDENTE")).toBe(true);
      expect(isContaPagarPendente("VENCIDA")).toBe(false);
    });
  });
});
