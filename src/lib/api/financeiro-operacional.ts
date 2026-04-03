/**
 * API de operações financeiras operacionais (tenant-level).
 *
 * NFS-e, agregador de transações e integrações operacionais.
 * Usado tanto pelas páginas da academia (app) quanto pelo backoffice.
 */
import type {
  AgregadorConciliacaoStatus,
  AgregadorRepasseStatus,
  AgregadorTransacao,
  AgregadorTransacaoStatus,
  IntegracaoOcorrenciaSeveridade,
  IntegracaoOperacional,
  IntegracaoOperacionalOcorrencia,
  IntegracaoOperacionalStatus,
  IntegracaoOperacionalTipo,
  NfseAmbiente,
  NfseClassificacaoTributaria,
  NfseConfiguracao,
  NfseConfiguracaoStatus,
  NfseIndicadorOperacao,
  NfseProvider,
  NfseRegimeTributario,
} from "@/lib/types";
import { ApiRequestError, apiRequest } from "@/lib/api/http";

// ---------------------------------------------------------------------------
// Tipos de resposta da API (normalizados internamente)
// ---------------------------------------------------------------------------

type NfseConfiguracaoApiResponse = Partial<NfseConfiguracao> & {
  id?: string | null;
  tenantId?: string | null;
  ambiente?: NfseAmbiente | null;
  provedor?: NfseProvider | null;
  prefeitura?: string | null;
  inscricaoMunicipal?: string | null;
  cnaePrincipal?: string | null;
  codigoTributacaoNacional?: string | null;
  codigoNbs?: string | null;
  classificacaoTributaria?: NfseClassificacaoTributaria | null;
  consumidorFinal?: unknown;
  indicadorOperacao?: NfseIndicadorOperacao | null;
  serieRps?: string | null;
  loteInicial?: unknown;
  aliquotaPadrao?: unknown;
  regimeTributario?: NfseRegimeTributario | null;
  emissaoAutomatica?: unknown;
  emailCopiaFinanceiro?: string | null;
  certificadoAlias?: string | null;
  webhookFiscalUrl?: string | null;
  status?: NfseConfiguracaoStatus | null;
  ultimaValidacaoEm?: string | null;
  ultimaSincronizacaoEm?: string | null;
  ultimoErro?: string | null;
};

type AgregadorTransacaoApiResponse = Partial<AgregadorTransacao> & {
  id?: string | null;
  tenantId?: string | null;
  adquirente?: AgregadorTransacao["adquirente"] | null;
  maquininhaNome?: string | null;
  nsu?: string | null;
  autorizacao?: string | null;
  bandeira?: string | null;
  meioCaptura?: AgregadorTransacao["meioCaptura"] | null;
  clienteNome?: string | null;
  descricao?: string | null;
  valorBruto?: unknown;
  taxa?: unknown;
  valorLiquido?: unknown;
  parcelas?: unknown;
  dataTransacao?: string | null;
  dataPrevistaRepasse?: string | null;
  dataRepasse?: string | null;
  statusTransacao?: AgregadorTransacaoStatus | null;
  statusRepasse?: AgregadorRepasseStatus | null;
  statusConciliacao?: AgregadorConciliacaoStatus | null;
  observacao?: string | null;
};

type IntegracaoOcorrenciaApiResponse = Partial<IntegracaoOperacionalOcorrencia> & {
  id?: string | null;
  integracaoId?: string | null;
  severidade?: IntegracaoOcorrenciaSeveridade | null;
  mensagem?: string | null;
  codigo?: string | null;
  dataCriacao?: string | null;
};

type IntegracaoOperacionalApiResponse = Partial<IntegracaoOperacional> & {
  id?: string | null;
  tenantId?: string | null;
  nome?: string | null;
  tipo?: IntegracaoOperacionalTipo | null;
  fornecedor?: string | null;
  status?: IntegracaoOperacionalStatus | null;
  filaPendente?: unknown;
  latenciaMs?: unknown;
  ultimaExecucaoEm?: string | null;
  ultimaSucessoEm?: string | null;
  ultimoErro?: string | null;
  linkDestino?: string | null;
  ocorrencias?: IntegracaoOcorrenciaApiResponse[] | null;
};

type ListPayload<T> =
  | T[]
  | {
      items?: T[];
      content?: T[];
      data?: T[];
      rows?: T[];
      result?: T[];
      itens?: T[];
    };

// ---------------------------------------------------------------------------
// Utilitários de normalização
// ---------------------------------------------------------------------------

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "sim") return true;
    if (normalized === "false" || normalized === "0" || normalized === "nao" || normalized === "não") return false;
  }
  return fallback;
}

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function extractItems<T>(payload: ListPayload<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.content ?? payload.data ?? payload.rows ?? payload.result ?? payload.itens ?? [];
}

// ---------------------------------------------------------------------------
// Normalizadores
// ---------------------------------------------------------------------------

function normalizeNfseConfiguracao(
  tenantId: string,
  input?: NfseConfiguracaoApiResponse | null
): NfseConfiguracao {
  return {
    id: cleanString(input?.id) ?? `nfse-${tenantId}`,
    tenantId: cleanString(input?.tenantId) ?? tenantId,
    ambiente: input?.ambiente ?? "HOMOLOGACAO",
    provedor: input?.provedor ?? "GINFES",
    prefeitura: cleanString(input?.prefeitura) ?? "",
    inscricaoMunicipal: cleanString(input?.inscricaoMunicipal) ?? "",
    cnaePrincipal: cleanString(input?.cnaePrincipal) ?? "",
    codigoTributacaoNacional: cleanString(input?.codigoTributacaoNacional) ?? "",
    codigoNbs: cleanString(input?.codigoNbs) ?? "",
    classificacaoTributaria: input?.classificacaoTributaria ?? "SERVICO_TRIBUTAVEL",
    consumidorFinal: toBoolean(input?.consumidorFinal, true),
    indicadorOperacao: input?.indicadorOperacao ?? "SERVICO_MUNICIPIO",
    serieRps: cleanString(input?.serieRps) ?? "",
    loteInicial: Math.max(1, toNumber(input?.loteInicial, 1)),
    aliquotaPadrao: Math.max(0, toNumber(input?.aliquotaPadrao, 0)),
    regimeTributario: input?.regimeTributario ?? "SIMPLES_NACIONAL",
    emissaoAutomatica: toBoolean(input?.emissaoAutomatica, true),
    emailCopiaFinanceiro: cleanString(input?.emailCopiaFinanceiro),
    certificadoAlias: cleanString(input?.certificadoAlias),
    webhookFiscalUrl: cleanString(input?.webhookFiscalUrl),
    status: input?.status ?? "PENDENTE",
    ultimaValidacaoEm: cleanString(input?.ultimaValidacaoEm),
    ultimaSincronizacaoEm: cleanString(input?.ultimaSincronizacaoEm),
    ultimoErro: cleanString(input?.ultimoErro),
  };
}

function normalizeAgregadorTransacao(input: AgregadorTransacaoApiResponse): AgregadorTransacao {
  return {
    id: cleanString(input.id) ?? "",
    tenantId: cleanString(input.tenantId) ?? "",
    pagamentoId: cleanString(input.pagamentoId),
    adquirente: input.adquirente ?? "STONE",
    maquininhaNome: cleanString(input.maquininhaNome),
    nsu: cleanString(input.nsu) ?? "",
    autorizacao: cleanString(input.autorizacao),
    bandeira: cleanString(input.bandeira) ?? "",
    meioCaptura: input.meioCaptura ?? "POS",
    clienteNome: cleanString(input.clienteNome) ?? "",
    descricao: cleanString(input.descricao) ?? "",
    valorBruto: toNumber(input.valorBruto),
    taxa: toNumber(input.taxa),
    valorLiquido: toNumber(input.valorLiquido),
    parcelas: Math.max(1, toNumber(input.parcelas, 1)),
    dataTransacao: cleanString(input.dataTransacao) ?? new Date().toISOString(),
    dataPrevistaRepasse: cleanString(input.dataPrevistaRepasse) ?? "",
    dataRepasse: cleanString(input.dataRepasse),
    statusTransacao: input.statusTransacao ?? "PENDENTE",
    statusRepasse: input.statusRepasse ?? "PREVISTO",
    statusConciliacao: input.statusConciliacao ?? "PENDENTE",
    observacao: cleanString(input.observacao),
  };
}

function normalizeIntegracaoOcorrencia(
  integracaoId: string,
  input: IntegracaoOcorrenciaApiResponse
): IntegracaoOperacionalOcorrencia {
  return {
    id: cleanString(input.id) ?? "",
    integracaoId: cleanString(input.integracaoId) ?? integracaoId,
    severidade: input.severidade ?? "INFO",
    mensagem: cleanString(input.mensagem) ?? "",
    codigo: cleanString(input.codigo),
    dataCriacao: cleanString(input.dataCriacao) ?? new Date().toISOString(),
  };
}

function normalizeIntegracaoOperacional(input: IntegracaoOperacionalApiResponse): IntegracaoOperacional {
  const id = cleanString(input.id) ?? "";
  return {
    id,
    tenantId: cleanString(input.tenantId) ?? "",
    nome: cleanString(input.nome) ?? "",
    tipo: input.tipo ?? "WEBHOOK",
    fornecedor: cleanString(input.fornecedor) ?? "",
    status: input.status ?? "CONFIGURACAO_PENDENTE",
    filaPendente: Math.max(0, toNumber(input.filaPendente, 0)),
    latenciaMs: input.latenciaMs == null ? undefined : Math.max(0, toNumber(input.latenciaMs, 0)),
    ultimaExecucaoEm: cleanString(input.ultimaExecucaoEm),
    ultimaSucessoEm: cleanString(input.ultimaSucessoEm),
    ultimoErro: cleanString(input.ultimoErro),
    linkDestino: cleanString(input.linkDestino),
    ocorrencias: Array.isArray(input.ocorrencias)
      ? input.ocorrencias.map((occurrence) => normalizeIntegracaoOcorrencia(id, occurrence))
      : [],
  };
}

// ---------------------------------------------------------------------------
// Endpoints NFS-e
// ---------------------------------------------------------------------------

export async function getNfseConfiguracaoAtualApi(input: {
  tenantId: string;
}): Promise<NfseConfiguracao> {
  try {
    const response = await apiRequest<NfseConfiguracaoApiResponse | null>({
      path: "/api/v1/administrativo/nfse/configuracao-atual",
      query: { tenantId: input.tenantId },
    });
    return normalizeNfseConfiguracao(input.tenantId, response);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return normalizeNfseConfiguracao(input.tenantId, null);
    }
    throw error;
  }
}

export async function salvarNfseConfiguracaoAtualApi(
  input: NfseConfiguracao
): Promise<NfseConfiguracao> {
  const response = await apiRequest<NfseConfiguracaoApiResponse>({
    path: "/api/v1/administrativo/nfse/configuracao-atual",
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: {
      ambiente: input.ambiente,
      provedor: input.provedor,
      prefeitura: input.prefeitura,
      inscricaoMunicipal: input.inscricaoMunicipal,
      cnaePrincipal: input.cnaePrincipal,
      codigoTributacaoNacional: input.codigoTributacaoNacional,
      codigoNbs: input.codigoNbs,
      classificacaoTributaria: input.classificacaoTributaria,
      consumidorFinal: input.consumidorFinal,
      indicadorOperacao: input.indicadorOperacao,
      serieRps: input.serieRps,
      loteInicial: input.loteInicial,
      aliquotaPadrao: input.aliquotaPadrao,
      regimeTributario: input.regimeTributario,
      emissaoAutomatica: input.emissaoAutomatica,
      emailCopiaFinanceiro: input.emailCopiaFinanceiro,
      certificadoAlias: input.certificadoAlias,
      webhookFiscalUrl: input.webhookFiscalUrl,
    },
  });
  return normalizeNfseConfiguracao(input.tenantId, response);
}

export async function validarNfseConfiguracaoAtualApi(input: {
  tenantId: string;
}): Promise<NfseConfiguracao> {
  const response = await apiRequest<NfseConfiguracaoApiResponse>({
    path: "/api/v1/administrativo/nfse/configuracao-atual/validar",
    method: "POST",
    query: { tenantId: input.tenantId },
  });
  return normalizeNfseConfiguracao(input.tenantId, response);
}

// ---------------------------------------------------------------------------
// Endpoints Agregador de Transações
// ---------------------------------------------------------------------------

export async function listAgregadorTransacoesApi(input: {
  tenantId: string;
}): Promise<AgregadorTransacao[]> {
  const response = await apiRequest<ListPayload<AgregadorTransacaoApiResponse>>({
    path: "/api/v1/gerencial/agregadores/transacoes",
    query: { tenantId: input.tenantId },
  });
  return extractItems(response).map(normalizeAgregadorTransacao);
}

export async function reprocessarAgregadorTransacaoApi(input: {
  tenantId: string;
  id: string;
}): Promise<AgregadorTransacao> {
  const response = await apiRequest<AgregadorTransacaoApiResponse>({
    path: `/api/v1/gerencial/agregadores/transacoes/${input.id}/reprocessar`,
    method: "POST",
    query: { tenantId: input.tenantId },
  });
  return normalizeAgregadorTransacao(response);
}

// ---------------------------------------------------------------------------
// Endpoints Integrações Operacionais
// ---------------------------------------------------------------------------

export async function listIntegracoesOperacionaisApi(input: {
  tenantId: string;
  includeAllTenants?: boolean;
}): Promise<IntegracaoOperacional[]> {
  const response = await apiRequest<ListPayload<IntegracaoOperacionalApiResponse>>({
    path: "/api/v1/administrativo/integracoes-operacionais",
    query: {
      tenantId: input.tenantId,
      includeAllTenants: input.includeAllTenants ?? false,
    },
  });
  return extractItems(response).map(normalizeIntegracaoOperacional);
}

export async function reprocessarIntegracaoOperacionalApi(input: {
  tenantId: string;
  id: string;
}): Promise<IntegracaoOperacional> {
  const response = await apiRequest<IntegracaoOperacionalApiResponse>({
    path: `/api/v1/administrativo/integracoes-operacionais/${input.id}/reprocessar`,
    method: "POST",
    query: { tenantId: input.tenantId },
  });
  return normalizeIntegracaoOperacional(response);
}
