/**
 * API client para operacao NFS-e (solicitacoes de emissao, retry, cancelamento,
 * timeline de eventos, resumo). Base: /api/v1/nfse.
 *
 * Task #543. Consome NfseController do backend Java.
 */
import { apiRequest } from "./http";

export type NfseStatus =
  | "EM_PROCESSAMENTO"
  | "EMITIDA"
  | "FALHA"
  | "CANCELADA"
  | "EM_CANCELAMENTO";

export interface NfseSolicitacaoItem {
  id: string;
  tenantId: string;
  unidadeId: string;
  numeroNota?: string;
  status: NfseStatus;
  valorServicos?: number;
  tomadorNome?: string;
  tomadorCnpj?: string;
  dataEmissao?: string;
  ultimaAtualizacao?: string;
  ultimoErro?: string;
  provedor?: string;
  codigoVerificacao?: string;
}

export interface NfseEvento {
  id: string;
  solicitacaoId: string;
  tipo: string;
  mensagem?: string;
  detalhes?: string;
  ocorridoEm: string;
}

export interface NfseResumo {
  tenantId: string;
  total: number;
  porStatus: Record<string, number>;
  ultimasFalhas: NfseSolicitacaoItem[];
  geradoEm?: string;
}

export interface NfseCancelamentoPayload {
  tenantId: string;
  unidadeId: string;
  motivo?: string;
}

export interface NfseRetryResponse {
  solicitacaoId: string;
  status: NfseStatus;
  mensagem?: string;
}

export async function listarNfseSolicitacoesApi(input: {
  tenantId: string;
  unidadeId: string;
  status?: NfseStatus;
  tomadorCnpj?: string;
  dataEmissaoInicio?: string;
  dataEmissaoFim?: string;
  page?: number;
  size?: number;
}): Promise<NfseSolicitacaoItem[]> {
  const response = await apiRequest<NfseSolicitacaoItem[]>({
    path: "/api/v1/nfse/solicitacoes",
    query: {
      tenantId: input.tenantId,
      unidadeId: input.unidadeId,
      status: input.status,
      tomadorCnpj: input.tomadorCnpj,
      dataEmissaoInicio: input.dataEmissaoInicio,
      dataEmissaoFim: input.dataEmissaoFim,
      page: input.page,
      size: input.size,
    },
  });
  return Array.isArray(response) ? response : [];
}

export async function listarNfseEventosApi(input: {
  tenantId: string;
  unidadeId: string;
  solicitacaoId: string;
}): Promise<NfseEvento[]> {
  const response = await apiRequest<NfseEvento[]>({
    path: `/api/v1/nfse/solicitacoes/${input.solicitacaoId}/eventos`,
    query: { tenantId: input.tenantId, unidadeId: input.unidadeId },
  });
  return Array.isArray(response) ? response : [];
}

export async function retryNfseSolicitacaoApi(input: {
  tenantId: string;
  unidadeId: string;
  solicitacaoId: string;
}): Promise<NfseRetryResponse> {
  return apiRequest<NfseRetryResponse>({
    path: `/api/v1/nfse/solicitacoes/${input.solicitacaoId}/retry`,
    method: "POST",
    query: { tenantId: input.tenantId, unidadeId: input.unidadeId },
  });
}

export async function cancelarNfseSolicitacaoApi(input: {
  tenantId: string;
  unidadeId: string;
  solicitacaoId: string;
  motivo?: string;
}): Promise<unknown> {
  return apiRequest<unknown>({
    path: `/api/v1/nfse/solicitacoes/${input.solicitacaoId}/cancelar`,
    method: "POST",
    body: {
      tenantId: input.tenantId,
      unidadeId: input.unidadeId,
      motivo: input.motivo,
    },
  });
}

export async function getNfseResumoApi(input: {
  tenantId: string;
  limiteFalhas?: number;
}): Promise<NfseResumo> {
  return apiRequest<NfseResumo>({
    path: "/api/v1/nfse/resumo",
    query: {
      tenantId: input.tenantId,
      limiteFalhas: input.limiteFalhas ?? 20,
    },
  });
}
