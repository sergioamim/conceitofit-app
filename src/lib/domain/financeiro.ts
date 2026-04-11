import type {
  AgregadorRepasseStatus,
  AgregadorTransacao,
  IntegracaoOperacional,
  IntegracaoOperacionalStatus,
  NfseClassificacaoTributaria,
  NfseConfiguracao,
  NfseConfiguracaoStatus,
  NfseIndicadorOperacao,
  Pagamento,
} from "@/lib/types";
import { isPagamentoEmAberto } from "@/lib/domain/status-helpers";

export const NFSE_STATUS_LABEL: Record<NfseConfiguracaoStatus, string> = {
  PENDENTE: "Pendente",
  CONFIGURADA: "Configurada",
  ERRO: "Com erro",
};

export const AGREGADOR_REPASSE_LABEL: Record<AgregadorRepasseStatus, string> = {
  PREVISTO: "Previsto",
  EM_TRANSITO: "Em trânsito",
  LIQUIDADO: "Liquidado",
  DIVERGENTE: "Divergente",
};

export const INTEGRACAO_STATUS_LABEL: Record<IntegracaoOperacionalStatus, string> = {
  SAUDAVEL: "Saudável",
  ATENCAO: "Atenção",
  FALHA: "Falha",
  CONFIGURACAO_PENDENTE: "Configuração pendente",
};

export const NFSE_CLASSIFICACAO_TRIBUTARIA_LABEL: Record<NfseClassificacaoTributaria, string> = {
  SERVICO_TRIBUTAVEL: "Serviço tributável",
  RETENCAO: "Retenção na fonte",
  ISENTO: "Isento",
  IMUNE: "Imune",
  NAO_INCIDENTE: "Não incidente",
};

export const NFSE_INDICADOR_OPERACAO_LABEL: Record<NfseIndicadorOperacao, string> = {
  // Task #557: alinhado com enum NfseIndicadorOperacao.java do BE
  PRESENCIAL: "Presencial",
  NAO_PRESENCIAL: "Não presencial",
};

export function getNfseBloqueioMensagem(input?: Partial<NfseConfiguracao> | null) {
  if (!input) return null;
  if (input.status === "CONFIGURADA") return null;
  if (input.ultimoErro?.trim()) {
    return `Emissão fiscal bloqueada: ${input.ultimoErro.trim()}`;
  }
  return "Emissão fiscal bloqueada até concluir e validar a configuração tributária da unidade.";
}

export function summarizeAgregadorTransacoes(transacoes: AgregadorTransacao[]) {
  return transacoes.reduce(
    (acc, item) => {
      acc.totalBruto += Number(item.valorBruto ?? 0);
      acc.totalLiquido += Number(item.valorLiquido ?? 0);
      if (item.statusRepasse === "LIQUIDADO") acc.totalLiquidado += Number(item.valorLiquido ?? 0);
      if (item.statusRepasse === "PREVISTO" || item.statusRepasse === "EM_TRANSITO") {
        acc.totalEmAberto += Number(item.valorLiquido ?? 0);
      }
      if (item.statusRepasse === "DIVERGENTE" || item.statusConciliacao === "DIVERGENTE") {
        acc.divergencias += 1;
      }
      return acc;
    },
    {
      totalBruto: 0,
      totalLiquido: 0,
      totalLiquidado: 0,
      totalEmAberto: 0,
      divergencias: 0,
    }
  );
}

export function summarizeRecebimentosOperacionais(
  pagamentos: Pagamento[],
  transacoes: AgregadorTransacao[]
) {
  const transacoesPorPagamento = new Map(transacoes.map((item) => [item.pagamentoId, item] as const));

  return pagamentos.reduce(
    (acc, pagamento) => {
      const valor = Number(pagamento.valorFinal ?? pagamento.valor ?? 0);
      if (pagamento.status === "PAGO") acc.recebido += valor;
      if (isPagamentoEmAberto(pagamento.status)) acc.emAberto += valor;
      if (pagamento.status === "VENCIDO") acc.inadimplencia += valor;
      if (pagamento.status === "PAGO" && !pagamento.nfseEmitida) acc.nfsePendente += 1;

      const transacao = pagamento.id ? transacoesPorPagamento.get(pagamento.id) : undefined;
      if (transacao?.statusRepasse === "DIVERGENTE") acc.repasseDivergente += 1;
      return acc;
    },
    {
      recebido: 0,
      emAberto: 0,
      inadimplencia: 0,
      nfsePendente: 0,
      repasseDivergente: 0,
    }
  );
}

export function summarizeIntegracoesOperacionais(integracoes: IntegracaoOperacional[]) {
  return integracoes.reduce(
    (acc, item) => {
      acc.total += 1;
      acc.filaPendente += Number(item.filaPendente ?? 0);
      if (item.status === "SAUDAVEL") acc.saudavel += 1;
      if (item.status === "ATENCAO") acc.atencao += 1;
      if (item.status === "FALHA") acc.falha += 1;
      if (item.status === "CONFIGURACAO_PENDENTE") acc.configuracaoPendente += 1;
      return acc;
    },
    {
      total: 0,
      saudavel: 0,
      atencao: 0,
      falha: 0,
      configuracaoPendente: 0,
      filaPendente: 0,
    }
  );
}

// ---------------------------------------------------------------------------
// NFS-e — Helpers de configuração (tenant-level)
// ---------------------------------------------------------------------------

export function validateNfseConfiguracaoDraft(input: Partial<NfseConfiguracao>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.prefeitura?.trim()) errors.prefeitura = "Informe a prefeitura emissora.";
  if (!input.inscricaoMunicipal?.trim()) errors.inscricaoMunicipal = "Informe a inscrição municipal.";
  if (!input.cnaePrincipal?.trim()) errors.cnaePrincipal = "Informe o CNAE principal.";
  if (!input.codigoTributacaoNacional?.trim()) {
    errors.codigoTributacaoNacional = "Informe o código de tributação nacional.";
  }
  if (!input.codigoNbs?.trim()) errors.codigoNbs = "Informe o código NBS.";
  if (!input.serieRps?.trim()) errors.serieRps = "Informe a série do RPS.";
  if (!input.provedor) errors.provedor = "Selecione o provedor fiscal.";
  if (!input.classificacaoTributaria) {
    errors.classificacaoTributaria = "Selecione a classificação tributária.";
  }
  if (!input.indicadorOperacao) {
    errors.indicadorOperacao = "Selecione o indicador da operação.";
  }

  const loteInicial = Number(input.loteInicial ?? 0);
  if (!Number.isFinite(loteInicial) || loteInicial <= 0) {
    errors.loteInicial = "Lote inicial deve ser maior que zero.";
  }

  const aliquotaPadrao = Number(input.aliquotaPadrao ?? 0);
  if (!Number.isFinite(aliquotaPadrao) || aliquotaPadrao <= 0) {
    errors.aliquotaPadrao = "Informe uma alíquota válida.";
  }

  return errors;
}

export function buildNfseChecklist(input: Partial<NfseConfiguracao>) {
  const errors = validateNfseConfiguracaoDraft(input);
  return [
    {
      id: "cadastro-fiscal",
      label: "Cadastro fiscal básico",
      done: !errors.prefeitura && !errors.inscricaoMunicipal && !errors.cnaePrincipal,
    },
    {
      id: "reforma-tributaria",
      label: "Campos da reforma tributária",
      done: !errors.codigoTributacaoNacional && !errors.codigoNbs && !errors.classificacaoTributaria,
    },
    {
      id: "parametros-rps",
      label: "Parâmetros de RPS e operação",
      done: !errors.serieRps && !errors.loteInicial && !errors.aliquotaPadrao && !errors.indicadorOperacao,
    },
    {
      id: "integracao",
      label: "Provedor, ambiente e retorno",
      done: Boolean(input.provedor && input.ambiente && input.webhookFiscalUrl?.trim()),
    },
  ];
}
