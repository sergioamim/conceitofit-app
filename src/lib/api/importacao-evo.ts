import { ApiRequestError, apiRequest } from "./http";
import { getActiveTenantIdFromSession } from "./session";

function normalizeTenantId(input?: string | null): string {
  return typeof input === "string" ? input.trim() : "";
}

function buildTenantHeaders(tenantId?: string): Record<string, string> {
  const directTenant = normalizeTenantId(tenantId);
  const activeTenant = normalizeTenantId(getActiveTenantIdFromSession());
  const tenant = directTenant || activeTenant;
  if (!tenant) return {};
  return {
    "X-Tenant-Id": tenant,
  };
}

function buildExplicitTenantHeaders(tenantId?: string): Record<string, string> {
  const tenant = normalizeTenantId(tenantId);
  if (!tenant) return {};
  return {
    "X-Tenant-Id": tenant,
  };
}

export type UploadAnaliseArquivo = {
  chave: string;
  rotulo: string;
  arquivoEsperado: string;
  disponivel: boolean;
  nomeArquivoEnviado?: string | null;
  tamanhoBytes?: number | null;
  dominio?: string | null;
  bloco?: string | null;
  descricao?: string | null;
  impactoAusencia?: string | null;
  requerParaImportacaoCompleta?: boolean | null;
  ultimoProcessamento?: UploadAnaliseArquivoUltimoProcessamento | null;
};

export type UploadAnaliseFilial = {
  evoFilialId?: number | null;
  evoAcademiaId?: number | null;
  nome?: string | null;
  documento?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  email?: string | null;
  telefone?: string | null;
  abreviacao?: string | null;
};

export type UploadAnaliseResponse = {
  uploadId: string;
  tenantId?: string | null;
  evoUnidadeId?: number | null;
  filialResolvida?: UploadAnaliseFilial | null;
  filiaisEncontradas?: UploadAnaliseFilial[] | null;
  criadoEm: string;
  expiraEm: string;
  totalArquivosDisponiveis: number;
  arquivos: UploadAnaliseArquivo[];
};

export type PacoteJobAceitoResponse = {
  jobId: string;
  status: string;
  dryRun: boolean;
  solicitadoEm: string;
};

export type EvoFotoImportEstadoResponse = {
  tenantId: string;
  bucket: string;
  storagePrefix: string;
  totalAlunos: number;
  vinculosEvoClientes: number;
  alunosComFoto: number;
  alunosComFotoImportada: number;
  importado: boolean;
};

export type EvoFotoImportJobResponse = {
  jobId: string;
  tenantId: string;
  uploadId?: string | null;
  status: string;
  dryRun: boolean;
  force: boolean;
  solicitadoEm: string;
};

export type EvoFotoImportJobStatusResponse = EvoFotoImportJobResponse & {
  finalizadoEm?: string | null;
  total?: number | null;
  uploaded?: number | null;
  skipped?: number | null;
  errors?: number | null;
  erro?: string | null;
  detalhes?: Array<{
    filename?: string | null;
    idClienteEvo?: string | null;
    motivo?: string | null;
  }> | null;
};

export type EvoImportJobStatus = "PROCESSANDO" | "CONCLUIDO" | "CONCLUIDO_COM_REJEICOES" | "FALHA";

export type EvoImportEntidadeResumo = {
  total: number;
  processadas: number;
  criadas: number;
  atualizadas: number;
  rejeitadas: number;
};

export type UploadAnaliseArquivoUltimoProcessamento = {
  jobId?: string | null;
  alias?: string | null;
  status?: EvoImportJobStatus | null;
  processadoEm?: string | null;
  resumo?: EvoImportEntidadeResumo | null;
  parcial?: boolean | null;
  mensagemParcial?: string | null;
  retrySomenteErrosSuportado?: boolean | null;
};

export type EvoImportColaboradoresBlocoResumo = EvoImportEntidadeResumo & {
  parcial?: boolean | null;
  mensagemParcial?: string | null;
  arquivosSelecionados?: string[] | null;
  arquivosAusentes?: string[] | null;
};

export type EvoImportColaboradoresResumo = {
  fichaPrincipal?: EvoImportColaboradoresBlocoResumo;
  funcoes?: EvoImportColaboradoresBlocoResumo;
  tiposOperacionais?: EvoImportColaboradoresBlocoResumo;
  horarios?: EvoImportColaboradoresBlocoResumo;
  contratacao?: EvoImportColaboradoresBlocoResumo;
  perfilLegado?: EvoImportColaboradoresBlocoResumo;
  alertas?: Array<{
    bloco?: string | null;
    mensagem: string;
    severidade?: "info" | "warning" | "error" | null;
  }> | null;
};

export type EvoImportJobResumo = {
  jobId?: string;
  tenantId?: string;
  tenantIds?: string[];
  status: EvoImportJobStatus;
  solicitadoEm?: string | null;
  finalizadoEm?: string | null;
  geral?: EvoImportEntidadeResumo;
  clientes?: EvoImportEntidadeResumo;
  prospects?: EvoImportEntidadeResumo;
  contratos?: EvoImportEntidadeResumo;
  clientesContratos?: EvoImportEntidadeResumo;
  vendas?: EvoImportEntidadeResumo;
  vendasItens?: EvoImportEntidadeResumo;
  recebimentos?: EvoImportEntidadeResumo;
  contasBancarias?: EvoImportEntidadeResumo;
  contasPagar?: EvoImportEntidadeResumo;
  gruposExercicio?: EvoImportEntidadeResumo;
  exerciciosTreino?: EvoImportEntidadeResumo;
  treinos?: EvoImportEntidadeResumo;
  treinosSeries?: EvoImportEntidadeResumo;
  treinosSeriesItens?: EvoImportEntidadeResumo;
  produtos?: EvoImportEntidadeResumo;
  produtoMovimentacoes?: EvoImportEntidadeResumo;
  servicos?: EvoImportEntidadeResumo;
  funcionarios?: EvoImportEntidadeResumo;
  colaboradoresDetalhe?: EvoImportColaboradoresResumo;
  maquininhas?: EvoImportEntidadeResumo;
  detalheErro?: string | null;
  rejeicoes?: { mensagem?: string };
};

export type EvoImportRejeicao = {
  id?: string;
  entidade: string;
  arquivo: string;
  linhaArquivo: number;
  sourceId?: string;
  motivo: string;
  criadoEm?: string;
  createdAt?: string;
  bloco?: string;
  subdominio?: string;
  payload?: unknown;
  mensagemAcionavel?: string;
  ocorrenciasAgrupadas?: number;
  reprocessamento?: {
    suportado?: boolean;
    escopo?: string | null;
    label?: string | null;
    descricao?: string | null;
    chave?: string | null;
    motivoBloqueio?: string | null;
  } | null;
};

export type EvoImportRejeicoesResponse = {
  items?: EvoImportRejeicao[];
  content?: EvoImportRejeicao[];
  hasNext?: boolean;
  page?: number;
  size?: number;
};

export type EvoCsvJobResponse = {
  jobId: string;
  id?: string;
  status: EvoImportJobStatus;
  solicitadoEm?: string;
  finalizadoEm?: string;
  geral?: EvoImportEntidadeResumo;
  tenantIds?: string[];
};

export async function uploadEvoP0PacoteApi(input: {
  tenantId?: string;
  evoUnidadeId?: number | null;
  arquivo: File;
  contextoTenantId?: string;
}): Promise<UploadAnaliseResponse> {
  const formData = new FormData();
  if (typeof input.tenantId === "string" && input.tenantId.trim()) {
    formData.append("tenantId", input.tenantId.trim());
  }
  if (
    typeof input.evoUnidadeId === "number" &&
    Number.isFinite(input.evoUnidadeId) &&
    input.evoUnidadeId > 0
  ) {
    formData.append("evoUnidadeId", String(input.evoUnidadeId));
  }
  formData.append("arquivo", input.arquivo, input.arquivo.name);

  return apiRequest<UploadAnaliseResponse>({
    path: "/api/v1/admin/integracoes/importacao-terceiros/evo/p0/pacote",
    method: "POST",
    body: formData,
    headers: buildExplicitTenantHeaders(input.contextoTenantId || input.tenantId),
    includeContextHeader: false,
  });
}

export async function getEvoP0PacoteAnaliseApi(input: {
  uploadId: string;
  contextoTenantId?: string;
  tenantId?: string;
}): Promise<UploadAnaliseResponse> {
  return apiRequest<UploadAnaliseResponse>({
    path: `/api/v1/admin/integracoes/importacao-terceiros/evo/p0/pacote/${input.uploadId}`,
    headers: buildExplicitTenantHeaders(input.tenantId ?? input.contextoTenantId),
    includeContextHeader: false,
  });
}

export async function createEvoP0PacoteJobApi(input: {
  uploadId: string;
  dryRun: boolean;
  arquivos?: string[] | null;
  retrySomenteErros?: boolean;
  tenantId?: string;
  apelido?: string | null;
  contextoTenantId?: string;
}): Promise<PacoteJobAceitoResponse> {
  const body: {
    dryRun: boolean;
    arquivos?: string[];
    tenantId?: string;
    apelido?: string;
  } = {
    dryRun: input.dryRun,
  };
  if (Array.isArray(input.arquivos) && input.arquivos.length > 0) {
    body.arquivos = input.arquivos;
  }
  const apelido = typeof input.apelido === "string" ? input.apelido.trim() : "";
  if (apelido) {
    body.apelido = apelido;
  }
  const tenantId = normalizeTenantId(input.tenantId ?? input.contextoTenantId);
  if (tenantId) {
    body.tenantId = tenantId;
  }

  return apiRequest<PacoteJobAceitoResponse>({
    path: `/api/v1/admin/integracoes/importacao-terceiros/evo/p0/pacote/${input.uploadId}/job`,
    method: "POST",
    body,
    headers: buildExplicitTenantHeaders(tenantId),
    includeContextHeader: false,
  });
}

export async function getEvoFotoImportEstadoApi(input: {
  tenantId?: string;
  contextoTenantId?: string;
}): Promise<EvoFotoImportEstadoResponse> {
  const tenantId = normalizeTenantId(input.tenantId ?? input.contextoTenantId);
  return apiRequest<EvoFotoImportEstadoResponse>({
    path: "/api/v1/admin/integracoes/importacao-terceiros/evo/p0/fotos/estado",
    query: tenantId ? { tenantId } : undefined,
    headers: buildExplicitTenantHeaders(tenantId),
    includeContextHeader: false,
  });
}

export async function createEvoPacoteFotoImportJobApi(input: {
  uploadId: string;
  tenantId?: string;
  contextoTenantId?: string;
  dryRun?: boolean;
  force?: boolean;
}): Promise<EvoFotoImportJobResponse> {
  const tenantId = normalizeTenantId(input.tenantId ?? input.contextoTenantId);
  const query: Record<string, string> = {};
  if (tenantId) {
    query.tenantId = tenantId;
  }
  if (input.dryRun) {
    query.dryRun = "true";
  }
  if (input.force) {
    query.force = "true";
  }

  return apiRequest<EvoFotoImportJobResponse>({
    path: `/api/v1/admin/integracoes/importacao-terceiros/evo/p0/pacote/${input.uploadId}/fotos/importar`,
    method: "POST",
    query,
    headers: buildExplicitTenantHeaders(tenantId),
    includeContextHeader: false,
  });
}

export async function createEvoUltimoLoteFotoImportJobApi(input: {
  tenantId?: string;
  contextoTenantId?: string;
  dryRun?: boolean;
  force?: boolean;
}): Promise<EvoFotoImportJobResponse> {
  const tenantId = normalizeTenantId(input.tenantId ?? input.contextoTenantId);
  const query: Record<string, string> = {};
  if (tenantId) {
    query.tenantId = tenantId;
  }
  if (input.dryRun) {
    query.dryRun = "true";
  }
  if (input.force) {
    query.force = "true";
  }

  return apiRequest<EvoFotoImportJobResponse>({
    path: "/api/v1/admin/integracoes/importacao-terceiros/evo/p0/fotos/importar",
    method: "POST",
    query,
    headers: buildExplicitTenantHeaders(tenantId),
    includeContextHeader: false,
  });
}

export async function getEvoFotoImportJobStatusApi(input: {
  jobId: string;
  tenantId?: string;
  contextoTenantId?: string;
}): Promise<EvoFotoImportJobStatusResponse> {
  const tenantId = normalizeTenantId(input.tenantId ?? input.contextoTenantId);
  return apiRequest<EvoFotoImportJobStatusResponse>({
    path: `/api/v1/admin/integracoes/importacao-terceiros/evo/p0/fotos/jobs/${input.jobId}`,
    query: tenantId ? { tenantId } : undefined,
    headers: buildExplicitTenantHeaders(tenantId),
    includeContextHeader: false,
  });
}

export async function createEvoP0CsvUploadApi(input: {
  dryRun: boolean;
  mapeamentoFiliais: Array<{ idFilialEvo: number; tenantId: string }>;
  arquivos: Array<{ field: string; file: File }>;
  tenantId?: string;
  contextoTenantId?: string;
}): Promise<EvoCsvJobResponse> {
  const formData = new FormData();
  formData.append("dryRun", String(input.dryRun));
  formData.append("mapeamentoFiliais", JSON.stringify(input.mapeamentoFiliais));
  input.arquivos.forEach(({ field, file }) => {
    formData.append(field, file, file.name);
  });

  return apiRequest<EvoCsvJobResponse>({
    path: "/api/v1/admin/integracoes/importacao-terceiros/evo/p0/upload",
    method: "POST",
    body: formData,
    headers: buildTenantHeaders(input.tenantId ?? input.contextoTenantId),
    includeContextHeader: false,
  });
}

export async function getEvoImportJobResumoApi(input: {
  jobId: string;
  tenantId?: string;
  contextoTenantId?: string;
}): Promise<EvoImportJobResumo> {
  const headers = buildTenantHeaders(input.tenantId ?? input.contextoTenantId);
  try {
    return await apiRequest<EvoImportJobResumo>({
      path: `/api/v1/admin/integracoes/importacao-terceiros/jobs/${input.jobId}/p0`,
      headers,
      includeContextHeader: false,
    });
  } catch (error) {
    if (!(error instanceof ApiRequestError) || error.status !== 404) {
      throw error;
    }
  }

  return apiRequest<EvoImportJobResumo>({
    path: `/api/v1/admin/integracoes/importacao-terceiros/jobs/${input.jobId}`,
    headers,
    includeContextHeader: false,
  });
}

export interface UltimoLoteResponse {
  jobId: string;
  apelido: string;
  status: string;
  arquivosDisponiveis: string[];
  arquivosSelecionados: string[];
  criadoEm: string;
  tenantId?: string;
}

export async function getUltimoLoteApi(input: {
  tenantId: string;
}): Promise<UltimoLoteResponse | null> {
  const tenantId = normalizeTenantId(input.tenantId);
  if (!tenantId) return null;
  try {
    const response = await apiRequest<UltimoLoteResponse | null | undefined>({
      path: "/api/v1/admin/integracoes/importacao-terceiros/jobs/last-for-tenant",
      query: { tenantId },
      headers: buildTenantHeaders(tenantId),
      includeContextHeader: false,
    });
    if (!response || typeof response !== "object") return null;
    // Backend pode retornar 204 (body vazio -> parsedBody undefined) ou objeto sem jobId.
    if (typeof (response as UltimoLoteResponse).jobId !== "string") return null;
    return response as UltimoLoteResponse;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 204) {
      return null;
    }
    throw error;
  }
}

export interface CargaResumo {
  cargaId: string;
  jobRaizId: string;
  apelido: string | null;
  statusUltimoJob: string;
  arquivosDisponiveis: string[];
  arquivosSelecionados: string[];
  tamanhoBytes: number;
  criadoEm: string;
  totalJobs: number;
}

export async function listCargasApi(input: {
  tenantId: string;
}): Promise<CargaResumo[]> {
  const tenantId = normalizeTenantId(input.tenantId);
  if (!tenantId) return [];
  const response = await apiRequest<CargaResumo[] | null | undefined>({
    path: "/api/v1/admin/integracoes/importacao-terceiros/cargas",
    query: { tenantId },
    headers: buildTenantHeaders(tenantId),
    includeContextHeader: false,
  });
  return Array.isArray(response) ? response : [];
}

export type EvoFotoJobListItem = {
  jobId: string;
  tenantId: string;
  status: string;
  iniciadoEm: string;
  concluidoEm?: string | null;
  duracaoSegundos?: number | null;
  total?: number | null;
  uploaded?: number | null;
  skipped?: number | null;
  errors?: number | null;
  erro?: string | null;
  dryRun: boolean;
};

export async function listFotosJobsApi(): Promise<EvoFotoJobListItem[]> {
  const response = await apiRequest<EvoFotoJobListItem[] | null | undefined>({
    path: "/api/v1/admin/integracoes/importacao-terceiros/evo/fotos/jobs",
    includeContextHeader: false,
  });
  return Array.isArray(response) ? response : [];
}

export type UnidadeStatusCsv = {
  tenantId: string;
  unidadeNome: string;
  unidadeSubdomain: string | null;
  ultimoJobId: string | null;
  ultimoJobStatus: string | null;
  ultimoJobCriadoEm: string | null;
  ultimoJobFinalizadoEm: string | null;
  ultimoJobTotalLinhas: number | null;
  ultimoJobProcessadas: number | null;
  ultimoJobRejeitadas: number | null;
  totalJobs: number;
};

export type UnidadeFotosJobAtivo = {
  jobId: string;
  status: string;
  iniciadoEm: string;
  concluidoEm?: string | null;
  duracaoSegundos?: number | null;
  total?: number | null;
  uploaded?: number | null;
  skipped?: number | null;
  errors?: number | null;
  erro?: string | null;
  dryRun: boolean;
};

export type UnidadeFotosStatus = {
  tenantId: string;
  unidadeNome: string;
  unidadeSubdomain: string | null;
  totalAlunos: number;
  alunosComFoto: number;
  alunosComFotoImportada: number;
  vinculosEvoClientes: number;
  importado: boolean;
  bucket: string;
  storagePrefix: string;
  jobAtivo: UnidadeFotosJobAtivo | null;
};

export type ReconciliacaoFotosResponse = {
  tenantId: string;
  verificados: number;
  reconciliados: number;
  jaEstavamOk: number;
  semArquivoNoMinio: number;
};

export async function reconciliarFotosApi(input: {
  tenantId: string;
}): Promise<ReconciliacaoFotosResponse> {
  const tenantId = normalizeTenantId(input.tenantId);
  if (!tenantId) {
    throw new Error("tenantId obrigatório para reconciliar fotos");
  }
  const response = await apiRequest<ReconciliacaoFotosResponse>({
    path: "/api/v1/admin/integracoes/importacao-terceiros/evo/fotos/reconciliar",
    method: "POST",
    query: { tenantId },
    headers: buildExplicitTenantHeaders(tenantId),
    includeContextHeader: false,
  });
  return response;
}

export async function listUnidadesFotosStatusApi(input: {
  academiaId: string;
}): Promise<UnidadeFotosStatus[]> {
  const academiaId = typeof input.academiaId === "string" ? input.academiaId.trim() : "";
  if (!academiaId) return [];
  const response = await apiRequest<UnidadeFotosStatus[] | null | undefined>({
    path: "/api/v1/admin/integracoes/importacao-terceiros/evo/fotos/unidades-estado",
    query: { academiaId },
    includeContextHeader: false,
  });
  return Array.isArray(response) ? response : [];
}

export async function listUnidadesStatusApi(input: {
  academiaId: string;
}): Promise<UnidadeStatusCsv[]> {
  const academiaId = typeof input.academiaId === "string" ? input.academiaId.trim() : "";
  if (!academiaId) return [];
  const response = await apiRequest<UnidadeStatusCsv[] | null | undefined>({
    path: `/api/v1/admin/integracoes/importacao-terceiros/academias/${academiaId}/unidades-status`,
    includeContextHeader: false,
  });
  return Array.isArray(response) ? response : [];
}

export async function deleteCargaApi(input: {
  cargaId: string;
  tenantId: string;
}): Promise<void> {
  const tenantId = normalizeTenantId(input.tenantId);
  const cargaId = typeof input.cargaId === "string" ? input.cargaId.trim() : "";
  if (!tenantId || !cargaId) return;
  await apiRequest<void>({
    path: `/api/v1/admin/integracoes/importacao-terceiros/cargas/${cargaId}`,
    method: "DELETE",
    query: { tenantId },
    headers: buildTenantHeaders(tenantId),
    includeContextHeader: false,
  });
}

export interface FromSourceInput {
  sourceJobId: string;
  apelido?: string;
  arquivosSelecionados?: string[];
  tenantId?: string;
}

export interface FromSourceResponse {
  jobId: string;
  apelido: string;
  status: string;
}

export async function fromSourceApi(input: FromSourceInput): Promise<FromSourceResponse> {
  const body: {
    sourceJobId: string;
    apelido?: string;
    arquivosSelecionados?: string[];
  } = { sourceJobId: input.sourceJobId };
  if (typeof input.apelido === "string" && input.apelido.trim().length > 0) {
    body.apelido = input.apelido.trim();
  }
  if (Array.isArray(input.arquivosSelecionados) && input.arquivosSelecionados.length > 0) {
    body.arquivosSelecionados = input.arquivosSelecionados;
  }
  return apiRequest<FromSourceResponse>({
    path: "/api/v1/admin/integracoes/importacao-terceiros/jobs/from-source",
    method: "POST",
    body,
    headers: buildTenantHeaders(input.tenantId),
    includeContextHeader: false,
  });
}

export async function listEvoImportJobRejeicoesApi(input: {
  jobId: string;
  page?: number;
  size?: number;
  tenantId?: string;
  contextoTenantId?: string;
}): Promise<EvoImportRejeicoesResponse> {
  const query = {
    page: input.page ?? 0,
    size: input.size ?? 50,
  };
  const headers = buildTenantHeaders(input.tenantId ?? input.contextoTenantId);
  try {
    return await apiRequest<EvoImportRejeicoesResponse>({
      path: `/api/v1/admin/integracoes/importacao-terceiros/jobs/${input.jobId}/rejeicoes`,
      query,
      headers,
      includeContextHeader: false,
    });
  } catch (error) {
    if (!(error instanceof ApiRequestError) || error.status !== 404) {
      throw error;
    }
  }

  return apiRequest<EvoImportRejeicoesResponse>({
    path: `/api/v1/admin/integracoes/importacao-terceiros/jobs/${input.jobId}/rejeicoes`,
    query: { ...query, legacy: true },
    headers,
    includeContextHeader: false,
  });
}

export type EvoImportRejeicaoResumoItem = {
  entidade: string;
  motivo: string;
  quantidade: number;
};

export async function listEvoImportJobRejeicaoResumoApi(input: {
  jobId: string;
  tenantId?: string;
}): Promise<EvoImportRejeicaoResumoItem[]> {
  return apiRequest<EvoImportRejeicaoResumoItem[]>({
    path: `/api/v1/admin/integracoes/importacao-terceiros/jobs/${input.jobId}/rejeicoes/resumo`,
    headers: buildTenantHeaders(input.tenantId),
    includeContextHeader: false,
  });
}
