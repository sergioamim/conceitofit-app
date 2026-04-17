/**
 * Cliente HTTP tipado para o domínio Gestão de Acessos v2.
 *
 * Espelha os endpoints dos controllers em `modulo-auth/`:
 * - PerfilAcessoController:     /api/v1/auth/perfis
 * - CapacidadeController:       /api/v1/auth/capacidades
 * - FeatureModuleController:    /api/v1/auth/features
 * - UsuarioPerfilController:    /api/v1/auth/usuarios-perfil
 * - PlanoSaasController:        /api/v1/auth/planos
 * - GrupoTenantController:      /api/v1/auth/grupos
 */

import { apiRequest } from "./http";
import type {
  CapacidadesPorGrupo,
  FeatureModule,
  GrupoTenant,
  PerfilAcesso,
  PerfilAcessoDetalhe,
  PlanoSaas,
  PlanoSaasDetalhe,
  UsuarioPerfil,
  UsuarioPerfilDetalhe,
} from "./gestao-acessos.types";

const GA_API_OPTIONS = {
  includeContextHeader: false,
} as const;

// ---------------------------------------------------------------------------
// Perfis de Acesso
// ---------------------------------------------------------------------------

/** `GET /api/v1/auth/perfis?dominio=&tenantId=` */
export async function listarPerfis(dominio: string, tenantId: string): Promise<PerfilAcesso[]> {
  return apiRequest<PerfilAcesso[]>({
    ...GA_API_OPTIONS,
    path: "/api/v1/auth/perfis",
    query: { dominio, tenantId },
  });
}

/** `GET /api/v1/auth/perfis/templates?dominio=` */
export async function listarPerfilTemplates(dominio: string): Promise<PerfilAcesso[]> {
  return apiRequest<PerfilAcesso[]>({
    ...GA_API_OPTIONS,
    path: "/api/v1/auth/perfis/templates",
    query: { dominio },
  });
}

/** `GET /api/v1/auth/perfis/{id}` */
export async function obterPerfil(id: string): Promise<PerfilAcessoDetalhe> {
  return apiRequest<PerfilAcessoDetalhe>({
    ...GA_API_OPTIONS,
    path: `/api/v1/auth/perfis/${encodeURIComponent(id)}`,
  });
}

/** `POST /api/v1/auth/perfis` */
export async function criarPerfil(data: {
  dominio: string;
  tenantId: string;
  nome: string;
  descricao?: string;
}): Promise<PerfilAcesso> {
  return apiRequest<PerfilAcesso>({
    ...GA_API_OPTIONS,
    path: "/api/v1/auth/perfis",
    method: "POST",
    body: data,
  });
}

/** `PUT /api/v1/auth/perfis/{id}` */
export async function atualizarPerfil(
  id: string,
  data: { nome?: string; descricao?: string },
): Promise<PerfilAcesso> {
  return apiRequest<PerfilAcesso>({
    ...GA_API_OPTIONS,
    path: `/api/v1/auth/perfis/${encodeURIComponent(id)}`,
    method: "PUT",
    body: data,
  });
}

/** `DELETE /api/v1/auth/perfis/{id}` (soft delete) */
export async function desativarPerfil(id: string): Promise<void> {
  await apiRequest<void>({
    ...GA_API_OPTIONS,
    path: `/api/v1/auth/perfis/${encodeURIComponent(id)}`,
    method: "DELETE",
  });
}

/** `PUT /api/v1/auth/perfis/{id}/capacidades` (bulk replace) */
export async function atualizarCapacidadesPerfil(
  perfilId: string,
  capacidadeKeys: string[],
): Promise<void> {
  await apiRequest<void>({
    ...GA_API_OPTIONS,
    path: `/api/v1/auth/perfis/${encodeURIComponent(perfilId)}/capacidades`,
    method: "PUT",
    body: { capacidadeKeys },
  });
}

/** `POST /api/v1/auth/perfis/importar` */
export async function importarPerfil(
  perfilOrigemId: string,
  tenantDestinoId: string,
  novoNome?: string,
): Promise<PerfilAcesso> {
  return apiRequest<PerfilAcesso>({
    ...GA_API_OPTIONS,
    path: "/api/v1/auth/perfis/importar",
    method: "POST",
    body: { perfilOrigemId, tenantDestinoId, novoNome },
  });
}

// ---------------------------------------------------------------------------
// Capacidades
// ---------------------------------------------------------------------------

/** `GET /api/v1/auth/capacidades?dominio=` — retorna agrupado por grupo */
export async function listarCapacidades(dominio: string): Promise<CapacidadesPorGrupo> {
  return apiRequest<CapacidadesPorGrupo>({
    ...GA_API_OPTIONS,
    path: "/api/v1/auth/capacidades",
    query: { dominio },
  });
}

// ---------------------------------------------------------------------------
// Usuário ↔ Perfil
// ---------------------------------------------------------------------------

/** `GET /api/v1/auth/usuarios-perfil/{userId}` */
export async function listarPerfisUsuario(userId: number): Promise<UsuarioPerfil[]> {
  return apiRequest<UsuarioPerfil[]>({
    ...GA_API_OPTIONS,
    path: `/api/v1/auth/usuarios-perfil/${userId}`,
  });
}

/** `GET /api/v1/auth/usuarios-perfil/{userId}/tenant/{tenantId}` */
export async function obterPerfilUsuarioTenant(
  userId: number,
  tenantId: string,
): Promise<UsuarioPerfilDetalhe> {
  return apiRequest<UsuarioPerfilDetalhe>({
    ...GA_API_OPTIONS,
    path: `/api/v1/auth/usuarios-perfil/${userId}/tenant/${encodeURIComponent(tenantId)}`,
  });
}

/** `GET /api/v1/auth/usuarios-perfil/{userId}/tenant/{tenantId}/capacidades` */
export async function obterCapacidadesEfetivas(
  userId: number,
  tenantId: string,
): Promise<string[]> {
  return apiRequest<string[]>({
    ...GA_API_OPTIONS,
    path: `/api/v1/auth/usuarios-perfil/${userId}/tenant/${encodeURIComponent(tenantId)}/capacidades`,
  });
}

/** `POST /api/v1/auth/usuarios-perfil/{userId}/tenant/{tenantId}/atribuir` */
export async function atribuirPerfil(
  userId: number,
  tenantId: string,
  perfilId: string,
): Promise<UsuarioPerfil> {
  return apiRequest<UsuarioPerfil>({
    ...GA_API_OPTIONS,
    path: `/api/v1/auth/usuarios-perfil/${userId}/tenant/${encodeURIComponent(tenantId)}/atribuir`,
    method: "POST",
    body: { perfilId },
  });
}

/** `POST /api/v1/auth/usuarios-perfil/{userId}/tenant/{tenantId}/override` */
export async function adicionarOverride(
  userId: number,
  tenantId: string,
  capacidadeKey: string,
  tipo: "GRANT" | "DENY",
  motivo?: string,
): Promise<void> {
  await apiRequest<void>({
    ...GA_API_OPTIONS,
    path: `/api/v1/auth/usuarios-perfil/${userId}/tenant/${encodeURIComponent(tenantId)}/override`,
    method: "POST",
    body: { capacidadeKey, tipo, motivo },
  });
}

/** `DELETE /api/v1/auth/usuarios-perfil/{userId}/tenant/{tenantId}/override/{capacidadeKey}` */
export async function removerOverride(
  userId: number,
  tenantId: string,
  capacidadeKey: string,
): Promise<void> {
  await apiRequest<void>({
    ...GA_API_OPTIONS,
    path: `/api/v1/auth/usuarios-perfil/${userId}/tenant/${encodeURIComponent(tenantId)}/override/${encodeURIComponent(capacidadeKey)}`,
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Feature Modules
// ---------------------------------------------------------------------------

/** `GET /api/v1/auth/features/modulos` — catalogo completo */
export async function listarModulos(): Promise<FeatureModule[]> {
  return apiRequest<FeatureModule[]>({
    ...GA_API_OPTIONS,
    path: "/api/v1/auth/features/modulos",
  });
}

/** `GET /api/v1/auth/features/tenant/{tenantId}` */
export async function listarFeaturesTenant(tenantId: string): Promise<FeatureModule[]> {
  return apiRequest<FeatureModule[]>({
    ...GA_API_OPTIONS,
    path: `/api/v1/auth/features/tenant/${encodeURIComponent(tenantId)}`,
  });
}

/** `POST /api/v1/auth/features/tenant/{tenantId}/habilitar` */
export async function habilitarFeature(tenantId: string, featureKey: string): Promise<void> {
  await apiRequest<void>({
    ...GA_API_OPTIONS,
    path: `/api/v1/auth/features/tenant/${encodeURIComponent(tenantId)}/habilitar`,
    method: "POST",
    body: { featureKey },
  });
}

/** `POST /api/v1/auth/features/tenant/{tenantId}/desabilitar` */
export async function desabilitarFeature(tenantId: string, featureKey: string): Promise<void> {
  await apiRequest<void>({
    ...GA_API_OPTIONS,
    path: `/api/v1/auth/features/tenant/${encodeURIComponent(tenantId)}/desabilitar`,
    method: "POST",
    body: { featureKey },
  });
}

// ---------------------------------------------------------------------------
// Planos SaaS
// ---------------------------------------------------------------------------

/** `GET /api/v1/auth/planos` */
export async function listarPlanos(): Promise<PlanoSaas[]> {
  return apiRequest<PlanoSaas[]>({
    ...GA_API_OPTIONS,
    path: "/api/v1/auth/planos",
  });
}

/** `GET /api/v1/auth/planos/{id}` */
export async function obterPlano(id: string): Promise<PlanoSaasDetalhe> {
  return apiRequest<PlanoSaasDetalhe>({
    ...GA_API_OPTIONS,
    path: `/api/v1/auth/planos/${encodeURIComponent(id)}`,
  });
}

/** `POST /api/v1/auth/planos` */
export async function criarPlano(data: {
  id: string;
  nome: string;
  descricao?: string;
}): Promise<PlanoSaas> {
  return apiRequest<PlanoSaas>({
    ...GA_API_OPTIONS,
    path: "/api/v1/auth/planos",
    method: "POST",
    body: data,
  });
}

/** `PUT /api/v1/auth/planos/{id}/features` (bulk replace) */
export async function atualizarFeaturesPlano(
  planoId: string,
  featureKeys: string[],
): Promise<void> {
  await apiRequest<void>({
    ...GA_API_OPTIONS,
    path: `/api/v1/auth/planos/${encodeURIComponent(planoId)}/features`,
    method: "PUT",
    body: { featureKeys },
  });
}

// ---------------------------------------------------------------------------
// Grupos de Tenants
// ---------------------------------------------------------------------------

/** `GET /api/v1/auth/grupos` */
export async function listarGrupos(): Promise<GrupoTenant[]> {
  return apiRequest<GrupoTenant[]>({
    ...GA_API_OPTIONS,
    path: "/api/v1/auth/grupos",
  });
}

/** `POST /api/v1/auth/grupos` */
export async function criarGrupo(data: {
  nome: string;
  descricao?: string;
}): Promise<GrupoTenant> {
  return apiRequest<GrupoTenant>({
    ...GA_API_OPTIONS,
    path: "/api/v1/auth/grupos",
    method: "POST",
    body: data,
  });
}

/** `POST /api/v1/auth/grupos/{id}/membros` */
export async function adicionarMembroGrupo(grupoId: string, tenantId: string): Promise<void> {
  await apiRequest<void>({
    ...GA_API_OPTIONS,
    path: `/api/v1/auth/grupos/${encodeURIComponent(grupoId)}/membros`,
    method: "POST",
    body: { tenantId },
  });
}

/** `DELETE /api/v1/auth/grupos/{id}/membros/{tenantId}` */
export async function removerMembroGrupo(grupoId: string, tenantId: string): Promise<void> {
  await apiRequest<void>({
    ...GA_API_OPTIONS,
    path: `/api/v1/auth/grupos/${encodeURIComponent(grupoId)}/membros/${encodeURIComponent(tenantId)}`,
    method: "DELETE",
  });
}

/** `PUT /api/v1/auth/grupos/{id}/features` (bulk replace) */
export async function atualizarFeaturesGrupo(
  grupoId: string,
  featureKeys: string[],
): Promise<void> {
  await apiRequest<void>({
    ...GA_API_OPTIONS,
    path: `/api/v1/auth/grupos/${encodeURIComponent(grupoId)}/features`,
    method: "PUT",
    body: { featureKeys },
  });
}
