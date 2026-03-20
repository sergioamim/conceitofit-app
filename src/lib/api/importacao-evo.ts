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

export type EvoImportJobStatus = "PROCESSANDO" | "CONCLUIDO" | "CONCLUIDO_COM_REJEICOES" | "FALHA";

export type EvoImportEntidadeResumo = {
  total: number;
  processadas: number;
  criadas: number;
  atualizadas: number;
  rejeitadas: number;
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
  });
}

export async function createEvoP0PacoteJobApi(input: {
  uploadId: string;
  dryRun: boolean;
  maxRejeicoesRetorno: number;
  arquivos?: string[] | null;
  tenantId?: string;
  evoUnidadeId?: number | null;
  contextoTenantId?: string;
}): Promise<PacoteJobAceitoResponse> {
  const body: {
    dryRun: boolean;
    maxRejeicoesRetorno: number;
    arquivos?: string[];
    tenantId?: string;
    evoUnidadeId?: number;
  } = {
    dryRun: input.dryRun,
    maxRejeicoesRetorno: input.maxRejeicoesRetorno,
  };
  if (Array.isArray(input.arquivos) && input.arquivos.length > 0) {
    body.arquivos = input.arquivos;
  }
  const tenantId = normalizeTenantId(input.tenantId ?? input.contextoTenantId);
  if (tenantId) {
    body.tenantId = tenantId;
  }
  if (
    typeof input.evoUnidadeId === "number" &&
    Number.isFinite(input.evoUnidadeId) &&
    input.evoUnidadeId > 0
  ) {
    body.evoUnidadeId = input.evoUnidadeId;
  }

  return apiRequest<PacoteJobAceitoResponse>({
    path: `/api/v1/admin/integracoes/importacao-terceiros/evo/p0/pacote/${input.uploadId}/job`,
    method: "POST",
    body,
    headers: buildExplicitTenantHeaders(tenantId),
  });
}

export async function createEvoP0CsvUploadApi(input: {
  dryRun: boolean;
  maxRejeicoesRetorno: number;
  mapeamentoFiliais: Array<{ idFilialEvo: number; tenantId: string }>;
  arquivos: Array<{ field: string; file: File }>;
  tenantId?: string;
  contextoTenantId?: string;
}): Promise<EvoCsvJobResponse> {
  const formData = new FormData();
  formData.append("dryRun", String(input.dryRun));
  formData.append("mapeamentoFiliais", JSON.stringify(input.mapeamentoFiliais));
  formData.append("maxRejeicoesRetorno", String(input.maxRejeicoesRetorno));
  input.arquivos.forEach(({ field, file }) => {
    formData.append(field, file, file.name);
  });

  return apiRequest<EvoCsvJobResponse>({
    path: "/api/v1/admin/integracoes/importacao-terceiros/evo/p0/upload",
    method: "POST",
    body: formData,
    headers: buildTenantHeaders(input.tenantId ?? input.contextoTenantId),
  });
}

export async function getEvoImportJobResumoApi(input: {
  jobId: string;
  maxRejeicoesRetorno?: number;
  tenantId?: string;
  contextoTenantId?: string;
}): Promise<EvoImportJobResumo> {
  const query = { maxRejeicoesRetorno: input.maxRejeicoesRetorno ?? 200 };
  const headers = buildTenantHeaders(input.tenantId ?? input.contextoTenantId);
  try {
    return await apiRequest<EvoImportJobResumo>({
      path: `/api/v1/admin/integracoes/importacao-terceiros/jobs/${input.jobId}/p0`,
      query,
      headers,
    });
  } catch (error) {
    if (!(error instanceof ApiRequestError) || error.status !== 404) {
      throw error;
    }
  }

  return apiRequest<EvoImportJobResumo>({
    path: `/api/v1/admin/integracoes/importacao-terceiros/jobs/${input.jobId}`,
    query,
    headers,
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
  });
}
