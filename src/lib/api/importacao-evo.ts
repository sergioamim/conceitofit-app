import { getActiveTenantIdFromSession } from "./session";
import { apiRequest } from "./http";

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

export type UploadAnaliseArquivo = {
  chave: string;
  rotulo: string;
  arquivoEsperado: string;
  disponivel: boolean;
  nomeArquivoEnviado?: string | null;
  tamanhoBytes?: number | null;
};

export type UploadAnaliseResponse = {
  uploadId: string;
  tenantId: string;
  evoUnidadeId: number;
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

export async function uploadEvoP0PacoteApi(input: {
  tenantId: string;
  evoUnidadeId: number;
  arquivo: File;
  contextoTenantId?: string;
}): Promise<UploadAnaliseResponse> {
  const formData = new FormData();
  formData.append("tenantId", input.tenantId);
  formData.append("evoUnidadeId", String(input.evoUnidadeId));
  formData.append("arquivo", input.arquivo, input.arquivo.name);

  return apiRequest<UploadAnaliseResponse>({
    path: "/api/v1/admin/integracoes/importacao-terceiros/evo/p0/pacote",
    method: "POST",
    body: formData,
    headers: buildTenantHeaders(input.contextoTenantId || input.tenantId),
  });
}

export async function getEvoP0PacoteAnaliseApi(input: {
  uploadId: string;
  contextoTenantId?: string;
  tenantId?: string;
}): Promise<UploadAnaliseResponse> {
  return apiRequest<UploadAnaliseResponse>({
    path: `/api/v1/admin/integracoes/importacao-terceiros/evo/p0/pacote/${input.uploadId}`,
    headers: buildTenantHeaders(input.tenantId ?? input.contextoTenantId),
  });
}

export async function createEvoP0PacoteJobApi(input: {
  uploadId: string;
  dryRun: boolean;
  maxRejeicoesRetorno: number;
  arquivos?: string[] | null;
  tenantId?: string;
  contextoTenantId?: string;
}): Promise<PacoteJobAceitoResponse> {
  const body: {
    dryRun: boolean;
    maxRejeicoesRetorno: number;
    arquivos?: string[];
  } = {
    dryRun: input.dryRun,
    maxRejeicoesRetorno: input.maxRejeicoesRetorno,
  };
  if (Array.isArray(input.arquivos) && input.arquivos.length > 0) {
    body.arquivos = input.arquivos;
  }

  return apiRequest<PacoteJobAceitoResponse>({
    path: `/api/v1/admin/integracoes/importacao-terceiros/evo/p0/pacote/${input.uploadId}/job`,
    method: "POST",
    body,
    headers: buildTenantHeaders(input.tenantId ?? input.contextoTenantId),
  });
}
