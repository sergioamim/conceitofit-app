"use client";

import {
  type ClienteListEnvelopeResponse,
  createAlunoApi,
  createAlunoComMatriculaApi,
  excluirAlunoApi,
  extractAlunosFromListResponse,
  extractAlunosTotais,
  getClienteOperationalContextApi,
  getAlunoApi,
  listAlunosApi,
  searchAlunosApi,
  migrarClienteParaUnidadeApi,
  updateAlunoApi,
} from "@/lib/api/alunos";
import { listPresencasByAlunoApi } from "@/lib/api/presencas";
import {
  createCartaoClienteApi,
  deleteCartaoClienteApi,
  listBandeirasCartaoApi,
  listCartoesClienteApi,
  setCartaoPadraoApi,
} from "@/lib/api/cartoes";
import { liberarAcessoCatracaApi, obterCatracaWsStatusPorTenantApi } from "@/lib/api/catraca";
import { ApiRequestError } from "@/lib/api/http";
import type {
  Aluno,
  AlunoTotaisStatus,
  BandeiraCartao,
  CartaoCliente,
  ClienteExclusaoResult,
  ClienteMigracaoUnidadeResult,
  ClienteOperationalContext,
  Presenca,
  StatusAluno,
} from "@/lib/types";

export type ListAlunosPageServiceResult = {
  items: Aluno[];
  total?: number;
  page: number;
  size: number;
  hasNext: boolean;
  totaisStatus?: AlunoTotaisStatus;
};

function extractPageMeta(response: ClienteListEnvelopeResponse, fallbackPage: number, fallbackSize: number) {
  return {
    page: typeof response.page === "number" ? response.page : fallbackPage,
    size: typeof response.size === "number" ? response.size : fallbackSize,
    hasNext: Boolean(response.hasNext),
  };
}

export async function listAlunosPageService(input: {
  tenantId: string;
  status?: StatusAluno;
  page?: number;
  size?: number;
}): Promise<ListAlunosPageServiceResult> {
  const response = await listAlunosApi({
    tenantId: input.tenantId,
    status: input.status,
    page: input.page,
    size: input.size,
  });
  const items = extractAlunosFromListResponse(response);
  const totaisStatus = extractAlunosTotais(response);
  if (Array.isArray(response)) {
    return {
      items,
      page: input.page ?? 0,
      size: input.size ?? items.length,
      total: items.length,
      hasNext: false,
    };
  }

  const meta = extractPageMeta(response, input.page ?? 0, input.size ?? items.length);
  return {
    items,
    page: meta.page,
    size: meta.size,
    total: totaisStatus?.total,
    hasNext: meta.hasNext,
    totaisStatus,
  };
}

export async function listAlunosService(input: {
  tenantId: string;
  status?: StatusAluno;
  size?: number;
}): Promise<Aluno[]> {
  const response = await listAlunosApi({
    tenantId: input.tenantId,
    status: input.status,
    page: 0,
    size: input.size ?? 500,
  });
  return extractAlunosFromListResponse(response);
}

export type AlunoDuplicidadeResult = {
  exists: boolean;
  alunoId?: string;
  alunoNome?: string;
};

export async function checkAlunoDuplicidadeService(input: {
  tenantId: string;
  search: string;
}): Promise<AlunoDuplicidadeResult> {
  const trimmed = input.search.trim();
  if (!trimmed) return { exists: false };
  try {
    const results = await searchAlunosApi({
      tenantId: input.tenantId,
      search: trimmed,
      page: 0,
      size: 1,
    });
    if (results.length > 0) {
      return {
        exists: true,
        alunoId: results[0].id,
        alunoNome: results[0].nome,
      };
    }
    return { exists: false };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw new Error(`Erro ao verificar duplicidade: ${error.message}`);
    }
    throw error;
  }
}

export async function createAlunoService(input: {
  tenantId: string;
  data: Parameters<typeof createAlunoApi>[0]["data"];
}): Promise<Aluno> {
  const result = await createAlunoApi(input);
  const { trackAlunoCreated } = await import("@/lib/shared/analytics");
  trackAlunoCreated(input.tenantId, result.id);
  return result;
}

export async function createAlunoComMatriculaService(input: {
  tenantId: string;
  data: Parameters<typeof createAlunoComMatriculaApi>[0]["data"];
}) {
  const result = await createAlunoComMatriculaApi(input);
  const { trackAlunoCreated, trackMatriculaCreated } = await import("@/lib/shared/analytics");
  trackAlunoCreated(input.tenantId, result.aluno.id);
  if (result.matricula?.id) {
    trackMatriculaCreated(input.tenantId, result.matricula.id, input.data.planoId);
  }
  return result;
}

export async function updateAlunoService(input: {
  tenantId: string;
  id: string;
  data: Parameters<typeof updateAlunoApi>[0]["data"];
}) {
  return updateAlunoApi(input);
}

export async function excluirAlunoService(input: {
  tenantId: string;
  id: string;
  justificativa: string;
  issuedBy?: string;
}): Promise<ClienteExclusaoResult> {
  const justificativa = input.justificativa.trim();
  if (!justificativa) {
    throw new Error("A justificativa é obrigatória.");
  }

  return excluirAlunoApi({
    tenantId: input.tenantId,
    id: input.id,
    data: {
      tenantId: input.tenantId,
      justificativa,
      issuedBy: input.issuedBy ?? "frontend",
    },
  });
}

export async function resolveAlunoTenantService(input: {
  alunoId: string;
  tenantId?: string;
  tenantIds?: string[];
}): Promise<{ tenantId: string; aluno: Aluno } | null> {
  const seen = new Set<string>();
  const tenantIds = [input.tenantId, ...(input.tenantIds ?? [])]
    .map((tenantId) => tenantId?.trim() ?? "")
    .filter((tenantId) => tenantId && !seen.has(tenantId) && seen.add(tenantId));

  for (const tenantId of tenantIds) {
    try {
      const aluno = await getAlunoApi({
        tenantId,
        id: input.alunoId,
        includeContextHeader: false,
      });
      if (aluno?.id) {
        return { tenantId, aluno };
      }
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 404) {
        continue;
      }
      throw error;
    }
  }

  return null;
}

export async function getClienteOperationalContextService(input: {
  alunoId: string;
  tenantId?: string;
  tenants?: Array<{ id: string; nome?: string }>;
}): Promise<ClienteOperationalContext | null> {
  try {
    return await getClienteOperationalContextApi({
      id: input.alunoId,
      tenantId: input.tenantId,
      includeContextHeader: false,
    });
  } catch (error) {
    if (
      !(error instanceof ApiRequestError)
      || ![404, 405, 501].includes(error.status)
    ) {
      throw error;
    }
  }

  const resolved = await resolveAlunoTenantService({
    alunoId: input.alunoId,
    tenantId: input.tenantId,
    tenantIds: (input.tenants ?? []).map((tenant) => tenant.id),
  });
  if (!resolved) {
    return null;
  }

  return {
    tenantId: resolved.tenantId,
    tenantName: input.tenants?.find((tenant) => tenant.id === resolved.tenantId)?.nome,
    baseTenantId: resolved.aluno.tenantId,
    baseTenantName: input.tenants?.find((tenant) => tenant.id === resolved.aluno.tenantId)?.nome,
    aluno: resolved.aluno,
    eligibleTenants: (input.tenants ?? []).map((tenant, index) => ({
      tenantId: tenant.id,
      tenantName: tenant.nome,
      eligible: true,
      defaultTenant: tenant.id === resolved.aluno.tenantId || index === 0,
      blockedReasons: [],
    })),
    blockedTenants: [],
    blocked: false,
  };
}

export async function migrarClienteParaUnidadeService(input: {
  tenantId: string;
  id: string;
  tenantDestinoId: string;
  justificativa: string;
  preservarContextoComercial?: boolean;
}): Promise<ClienteMigracaoUnidadeResult> {
  const justificativa = input.justificativa.trim();
  if (!justificativa) {
    throw new Error("A justificativa é obrigatória.");
  }

  return migrarClienteParaUnidadeApi({
    tenantId: input.tenantId,
    id: input.id,
    data: {
      tenantDestinoId: input.tenantDestinoId,
      justificativa,
      preservarContextoComercial: input.preservarContextoComercial ?? true,
    },
  });
}

export async function listPresencasByAlunoService(input: {
  tenantId: string;
  alunoId: string;
}): Promise<Presenca[]> {
  return listPresencasByAlunoApi(input);
}

export async function listBandeirasCartaoService(input?: {
  apenasAtivas?: boolean;
}): Promise<BandeiraCartao[]> {
  return listBandeirasCartaoApi(input);
}

export async function listCartoesClienteService(input: {
  tenantId: string;
  alunoId: string;
}): Promise<CartaoCliente[]> {
  return listCartoesClienteApi(input);
}

export async function createCartaoClienteService(input: {
  tenantId: string;
  alunoId: string;
  data: Parameters<typeof createCartaoClienteApi>[0]["data"];
}): Promise<CartaoCliente> {
  return createCartaoClienteApi(input);
}

export async function setCartaoPadraoService(input: {
  tenantId: string;
  id: string;
}): Promise<void> {
  return setCartaoPadraoApi(input);
}

export async function deleteCartaoClienteService(input: {
  tenantId: string;
  id: string;
}): Promise<void> {
  return deleteCartaoClienteApi(input);
}

function resolveOnlineAgentId(status: Awaited<ReturnType<typeof obterCatracaWsStatusPorTenantApi>>) {
  const tenantStatus = status.tenants[0];
  if (!tenantStatus) return undefined;
  return tenantStatus.agents?.[0]?.agentId;
}

export async function liberarAcessoCatracaService(input: {
  tenantId: string;
  alunoId: string;
  justificativa: string;
  issuedBy?: string;
}): Promise<string> {
  const reason = input.justificativa.trim();
  if (!reason) {
    throw new Error("A justificativa é obrigatória.");
  }

  const status = await obterCatracaWsStatusPorTenantApi({
    tenantId: input.tenantId,
  });
  const agentId = resolveOnlineAgentId(status);
  if (!agentId) {
    throw new Error("Nenhum agente da catraca conectado para este tenant.");
  }

  const response = await liberarAcessoCatracaApi({
    agentId,
    memberId: input.alunoId,
    reason,
    issuedBy: input.issuedBy ?? "frontend",
  });
  return response.requestId;
}
