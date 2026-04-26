/**
 * Clients HTTP para os 5 endpoints novos do RBAC v2 + reuso dos existentes.
 *
 * Backend: ver `academia-java/docs/api/rbac-v2.yaml`.
 */

import { apiRequest } from "@/lib/api/http";
import { listarPerfilTemplates, listarPerfis } from "@/lib/api/gestao-acessos";
import type { PerfilAcesso } from "@/lib/api/gestao-acessos.types";
import type {
  AtualizarPoliticaPayload,
  CriarConvitesPayload,
  Dominio,
  EventoAuditoria,
  ListarAuditoriaParams,
  ListarUsuariosParams,
  PageResponse,
  PoliticaSeguranca,
  ResetarSenhaResponse,
  ResultadoConvites,
  StatsResponse,
  UsuarioDetalhe,
  UsuarioListItem,
} from "./types";

/**
 * Helper de contexto: para PLATAFORMA (sem tenant) ou quando tenantId está vazio,
 * busca papéis-template (system, tenant_id=null). Para ACADEMIA, busca por tenant.
 */
export function listarPerfisContexto(
  dominio: Dominio,
  tenantId?: string,
): Promise<PerfilAcesso[]> {
  if (dominio === "PLATAFORMA" || !tenantId) {
    return listarPerfilTemplates(dominio);
  }
  return listarPerfis(dominio, tenantId);
}

const API_OPTIONS = { includeContextHeader: false } as const;
const BASE = "/api/v1/auth/gestao-acessos";

/** `GET /api/v1/auth/gestao-acessos/usuarios/{id}` */
export function obterUsuario(id: number): Promise<UsuarioDetalhe> {
  return apiRequest<UsuarioDetalhe>({
    ...API_OPTIONS,
    path: `${BASE}/usuarios/${id}`,
  });
}

/** `PUT /api/v1/auth/gestao-acessos/usuarios/{id}/status` */
export function alterarStatusUsuario(
  id: number,
  payload: { ativo: boolean; motivo?: string },
): Promise<UsuarioDetalhe> {
  return apiRequest<UsuarioDetalhe>({
    ...API_OPTIONS,
    path: `${BASE}/usuarios/${id}/status`,
    method: "PUT",
    body: payload,
  });
}

/** `POST /api/v1/auth/gestao-acessos/usuarios/{id}/resetar-senha` */
export function resetarSenhaUsuario(id: number): Promise<ResetarSenhaResponse> {
  return apiRequest<ResetarSenhaResponse>({
    ...API_OPTIONS,
    path: `${BASE}/usuarios/${id}/resetar-senha`,
    method: "POST",
    body: {},
  });
}

export interface PapelGrant {
  id: string;
  nome: string;
  cor: string | null;
  tipo: string;
}

/** `GET /api/v1/auth/gestao-acessos/capacidades/papeis-por-capacidade` */
export function papeisPorCapacidade(
  dominio: Dominio,
  tenantId?: string,
): Promise<Record<string, PapelGrant[]>> {
  return apiRequest<Record<string, PapelGrant[]>>({
    ...API_OPTIONS,
    path: `${BASE}/capacidades/papeis-por-capacidade`,
    query: { dominio, tenantId },
  });
}

/** `GET /api/v1/auth/gestao-acessos/stats` */
export function getStats(params: { dominio: Dominio; tenantId?: string }): Promise<StatsResponse> {
  return apiRequest<StatsResponse>({
    ...API_OPTIONS,
    path: `${BASE}/stats`,
    query: { dominio: params.dominio, tenantId: params.tenantId },
  });
}

/** `GET /api/v1/auth/gestao-acessos/usuarios` */
export function listarUsuarios(params: ListarUsuariosParams): Promise<PageResponse<UsuarioListItem>> {
  return apiRequest<PageResponse<UsuarioListItem>>({
    ...API_OPTIONS,
    path: `${BASE}/usuarios`,
    query: {
      dominio: params.dominio,
      tenantId: params.tenantId,
      papelId: params.papelId,
      status: params.status,
      q: params.q,
      page: params.page,
      size: params.size,
    },
  });
}

/** `GET /api/v1/auth/gestao-acessos/auditoria` */
export function listarAuditoria(params: ListarAuditoriaParams): Promise<PageResponse<EventoAuditoria>> {
  return apiRequest<PageResponse<EventoAuditoria>>({
    ...API_OPTIONS,
    path: `${BASE}/auditoria`,
    query: {
      dominio: params.dominio,
      tenantId: params.tenantId,
      categoria: params.categoria,
      range: params.range,
      critico: params.critico,
      q: params.q,
      page: params.page,
      size: params.size,
    },
  });
}

/** `POST /api/v1/auth/gestao-acessos/convites` */
export function criarConvites(payload: CriarConvitesPayload): Promise<ResultadoConvites> {
  return apiRequest<ResultadoConvites>({
    ...API_OPTIONS,
    path: `${BASE}/convites`,
    method: "POST",
    body: payload,
  });
}

/** `GET /api/v1/auth/gestao-acessos/politica-seguranca` */
export function obterPoliticaSeguranca(params: {
  dominio: Dominio;
  tenantId?: string;
}): Promise<PoliticaSeguranca> {
  return apiRequest<PoliticaSeguranca>({
    ...API_OPTIONS,
    path: `${BASE}/politica-seguranca`,
    query: { dominio: params.dominio, tenantId: params.tenantId },
  });
}

/** `PUT /api/v1/auth/gestao-acessos/politica-seguranca` */
export function atualizarPoliticaSeguranca(
  payload: AtualizarPoliticaPayload,
): Promise<PoliticaSeguranca> {
  return apiRequest<PoliticaSeguranca>({
    ...API_OPTIONS,
    path: `${BASE}/politica-seguranca`,
    method: "PUT",
    body: payload,
  });
}
