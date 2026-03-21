import {
  type EvoImportColaboradoresBlocoResumo,
  createEvoP0CsvUploadApi,
  createEvoP0PacoteJobApi,
  getEvoImportJobResumoApi,
  getEvoP0PacoteAnaliseApi,
  listEvoImportJobRejeicoesApi,
  uploadEvoP0PacoteApi,
  type EvoImportEntidadeResumo,
  type EvoImportJobResumo,
  type EvoImportJobStatus,
  type EvoImportRejeicao,
  type EvoImportRejeicoesResponse,
  type UploadAnaliseResponse,
} from "@/lib/api/importacao-evo";

export type EvoColaboradorDiagnosticoStatus =
  | "naoSelecionado"
  | "semLinhas"
  | "comRejeicoes"
  | "sucesso";

export type EvoColaboradorDiagnosticoNormalizado = {
  arquivosSelecionados: string[];
  arquivosAusentes: string[];
  status: EvoColaboradorDiagnosticoStatus;
};

function normalizeArquivoLista(
  values: string[] | null | undefined,
  canonicalizeFile?: (value?: string | null) => string | null
): string[] {
  if (!Array.isArray(values)) return [];
  const deduplicated = new Set<string>();
  values.forEach((value) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (!trimmed) return;
    const canonical = canonicalizeFile?.(trimmed) ?? trimmed;
    if (!canonical) return;
    deduplicated.add(canonical);
  });
  return Array.from(deduplicated);
}

export function normalizeEvoColaboradorDiagnostico(input: {
  resumo?: EvoImportColaboradoresBlocoResumo | null;
  fallbackArquivosSelecionados?: string[];
  fallbackArquivosAusentes?: string[];
  canonicalizeFile?: (value?: string | null) => string | null;
}): EvoColaboradorDiagnosticoNormalizado {
  const arquivosSelecionados = normalizeArquivoLista(
    input.resumo?.arquivosSelecionados ?? input.fallbackArquivosSelecionados,
    input.canonicalizeFile
  );
  const arquivosAusentes = normalizeArquivoLista(
    input.resumo?.arquivosAusentes ?? input.fallbackArquivosAusentes,
    input.canonicalizeFile
  );
  const total = Number(input.resumo?.total ?? 0);
  const rejeitadas = Number(input.resumo?.rejeitadas ?? 0);
  const mensagemParcial = input.resumo?.mensagemParcial?.trim();

  let status: EvoColaboradorDiagnosticoStatus;
  if (arquivosSelecionados.length === 0) {
    status = "naoSelecionado";
  } else if (rejeitadas > 0 || Boolean(input.resumo?.parcial) || Boolean(mensagemParcial)) {
    status = "comRejeicoes";
  } else if (!Number.isFinite(total) || total <= 0) {
    status = "semLinhas";
  } else {
    status = "sucesso";
  }

  return {
    arquivosSelecionados,
    arquivosAusentes,
    status,
  };
}

export type BackofficeEvoJobAceitoResponse = {
  jobId: string;
  status: string;
  solicitadoEm?: string;
  finalizadoEm?: string;
  geral?: EvoImportEntidadeResumo;
  dryRun?: boolean;
  tenantIds?: string[];
};

type CsvJobInput = {
  dryRun: boolean;
  maxRejeicoesRetorno: number;
  mapeamentoFiliais: Array<{ idFilialEvo: number; tenantId: string }>;
  arquivos: Array<{ field: string; file: File }>;
  tenantId?: string;
  contextoTenantId?: string;
};

type PacoteJobInput = {
  uploadId: string;
  dryRun: boolean;
  maxRejeicoesRetorno: number;
  arquivos?: string[] | null;
  tenantId?: string;
  evoUnidadeId?: number | null;
  contextoTenantId?: string;
};

type PackageUploadInput = {
  tenantId?: string;
  evoUnidadeId?: number | null;
  arquivo: File;
  contextoTenantId?: string;
};

type PackageAnaliseInput = {
  uploadId: string;
  tenantId?: string;
  contextoTenantId?: string;
};

type JobResumoInput = {
  jobId: string;
  maxRejeicoesRetorno?: number;
  tenantId?: string;
  contextoTenantId?: string;
};

type RejeicoesInput = {
  jobId: string;
  page?: number;
  size?: number;
  tenantId?: string;
  contextoTenantId?: string;
};

export async function uploadBackofficeEvoP0Pacote(input: PackageUploadInput): Promise<UploadAnaliseResponse> {
  return uploadEvoP0PacoteApi(input);
}

export async function getBackofficeEvoP0PacoteAnalise(input: PackageAnaliseInput): Promise<UploadAnaliseResponse> {
  return getEvoP0PacoteAnaliseApi(input);
}

export async function createBackofficeEvoP0PacoteJob(input: PacoteJobInput): Promise<BackofficeEvoJobAceitoResponse> {
  return createEvoP0PacoteJobApi(input);
}

export async function createBackofficeEvoP0CsvJob(input: CsvJobInput): Promise<BackofficeEvoJobAceitoResponse> {
  return createEvoP0CsvUploadApi(input);
}

export async function getBackofficeEvoImportJobResumo(input: JobResumoInput): Promise<EvoImportJobResumo> {
  return getEvoImportJobResumoApi(input);
}

export async function listBackofficeEvoImportJobRejeicoes(input: RejeicoesInput): Promise<EvoImportRejeicoesResponse> {
  return listEvoImportJobRejeicoesApi(input);
}

export type {
  EvoImportColaboradoresBlocoResumo,
  EvoImportEntidadeResumo,
  EvoImportJobResumo,
  EvoImportJobStatus,
  EvoImportRejeicao,
  EvoImportRejeicoesResponse,
  UploadAnaliseResponse,
};
