import {
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
  EvoImportEntidadeResumo,
  EvoImportJobResumo,
  EvoImportJobStatus,
  EvoImportRejeicao,
  EvoImportRejeicoesResponse,
  UploadAnaliseResponse,
};
