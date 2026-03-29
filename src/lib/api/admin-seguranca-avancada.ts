import type {
  CatalogoFuncionalidade,
  CatalogoFuncionalidadePayload,
  ExcecaoCreatePayload,
  ExcecaoRevisaoPayload,
  ExcecaoRevisaoResult,
  GlobalAdminAccessException,
  GlobalAdminRiskLevel,
  PerfilPadrao,
  PerfilPadraoCreatePayload,
  PerfilPadraoVersao,
  RbacGrantPayload,
  SecurityBusinessScope,
} from "@/lib/types";
import { apiRequest } from "./http";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

type AnyListResponse<T> =
  | T[]
  | { items?: T[]; content?: T[]; data?: T[]; rows?: T[]; result?: T[] };

function extractItems<T>(response: AnyListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return response.items ?? response.content ?? response.data ?? response.rows ?? response.result ?? [];
}

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1) return true;
  if (value === "false" || value === 0) return false;
  return fallback;
}

function toRiskLevel(value: unknown): GlobalAdminRiskLevel {
  const valid: GlobalAdminRiskLevel[] = ["BAIXO", "MEDIO", "ALTO", "CRITICO"];
  if (typeof value === "string" && valid.includes(value as GlobalAdminRiskLevel)) {
    return value as GlobalAdminRiskLevel;
  }
  return "BAIXO";
}

function toScopes(value: unknown): SecurityBusinessScope[] {
  if (!Array.isArray(value)) return [];
  const valid: SecurityBusinessScope[] = ["UNIDADE", "ACADEMIA", "REDE"];
  return value.filter((v): v is SecurityBusinessScope => valid.includes(v as SecurityBusinessScope));
}

// ---------------------------------------------------------------------------
// Catálogo de Funcionalidades
// ---------------------------------------------------------------------------

type CatalogoApiResponse = Partial<CatalogoFuncionalidade> & {
  id?: string | null;
  featureKey?: string | null;
  moduleKey?: string | null;
  moduleLabel?: string | null;
  capabilityLabel?: string | null;
  businessLabel?: string | null;
  description?: string | null;
  riskLevel?: unknown;
  scopes?: unknown;
  requiresAudit?: unknown;
  requiresApproval?: unknown;
  requiresMfa?: unknown;
  active?: unknown;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function normalizeCatalogo(input: CatalogoApiResponse): CatalogoFuncionalidade {
  return {
    id: cleanString(input.id) ?? "",
    featureKey: cleanString(input.featureKey) ?? "",
    moduleKey: cleanString(input.moduleKey) ?? "",
    moduleLabel: cleanString(input.moduleLabel) ?? "",
    capabilityLabel: cleanString(input.capabilityLabel) ?? "",
    businessLabel: cleanString(input.businessLabel) ?? "",
    description: cleanString(input.description) ?? "",
    riskLevel: toRiskLevel(input.riskLevel),
    scopes: toScopes(input.scopes),
    requiresAudit: toBoolean(input.requiresAudit),
    requiresApproval: toBoolean(input.requiresApproval),
    requiresMfa: toBoolean(input.requiresMfa),
    active: toBoolean(input.active, true),
    createdAt: cleanString(input.createdAt),
    updatedAt: cleanString(input.updatedAt),
  };
}

export async function listCatalogoFuncionalidades(): Promise<CatalogoFuncionalidade[]> {
  const response = await apiRequest<AnyListResponse<CatalogoApiResponse>>({
    path: "/api/v1/admin/seguranca/catalogo-funcionalidades",
  });
  return extractItems(response).map(normalizeCatalogo);
}

export async function createCatalogoFuncionalidade(
  data: CatalogoFuncionalidadePayload
): Promise<CatalogoFuncionalidade> {
  const response = await apiRequest<CatalogoApiResponse>({
    path: "/api/v1/admin/seguranca/catalogo-funcionalidades",
    method: "POST",
    body: data,
  });
  return normalizeCatalogo(response);
}

export async function updateCatalogoFuncionalidade(
  id: string,
  data: CatalogoFuncionalidadePayload
): Promise<CatalogoFuncionalidade> {
  const response = await apiRequest<CatalogoApiResponse>({
    path: `/api/v1/admin/seguranca/catalogo-funcionalidades/${id}`,
    method: "PUT",
    body: data,
  });
  return normalizeCatalogo(response);
}

// ---------------------------------------------------------------------------
// Perfis Padrão com Versionamento
// ---------------------------------------------------------------------------

type PerfilPadraoApiResponse = Partial<PerfilPadrao> & {
  key?: string | null;
  displayName?: string | null;
  description?: string | null;
  objective?: string | null;
  recommendedScope?: unknown;
  riskLevel?: unknown;
  active?: unknown;
  versaoAtual?: unknown;
  versoes?: unknown;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type VersaoApiResponse = Partial<PerfilPadraoVersao> & {
  versao?: unknown;
  descricao?: string | null;
  grants?: unknown;
  criadoEm?: string | null;
  criadoPor?: string | null;
};

function normalizeVersao(input: VersaoApiResponse): PerfilPadraoVersao {
  return {
    versao: toNumber(input.versao, 1),
    descricao: cleanString(input.descricao) ?? "",
    grants: Array.isArray(input.grants) ? (input.grants as RbacGrantPayload[]) : [],
    criadoEm: cleanString(input.criadoEm) ?? "",
    criadoPor: cleanString(input.criadoPor),
  };
}

function normalizePerfilPadrao(input: PerfilPadraoApiResponse): PerfilPadrao {
  const scope = cleanString(input.recommendedScope as string);
  const validScopes: SecurityBusinessScope[] = ["UNIDADE", "ACADEMIA", "REDE"];
  const recommendedScope = validScopes.includes(scope as SecurityBusinessScope)
    ? (scope as SecurityBusinessScope)
    : "UNIDADE";

  return {
    key: cleanString(input.key) ?? "",
    displayName: cleanString(input.displayName) ?? "",
    description: cleanString(input.description),
    objective: cleanString(input.objective) ?? "",
    recommendedScope,
    riskLevel: toRiskLevel(input.riskLevel),
    active: toBoolean(input.active, true),
    versaoAtual: toNumber(input.versaoAtual, 1),
    versoes: Array.isArray(input.versoes)
      ? (input.versoes as VersaoApiResponse[]).map(normalizeVersao)
      : undefined,
    createdAt: cleanString(input.createdAt),
    updatedAt: cleanString(input.updatedAt),
  };
}

export async function listPerfisPadrao(): Promise<PerfilPadrao[]> {
  const response = await apiRequest<AnyListResponse<PerfilPadraoApiResponse>>({
    path: "/api/v1/admin/seguranca/perfis-padrao",
  });
  return extractItems(response).map(normalizePerfilPadrao);
}

export async function getPerfilPadraoVersoes(key: string): Promise<PerfilPadraoVersao[]> {
  const response = await apiRequest<AnyListResponse<VersaoApiResponse>>({
    path: `/api/v1/admin/seguranca/perfis-padrao/${encodeURIComponent(key)}/versoes`,
  });
  return extractItems(response).map(normalizeVersao);
}

export async function createPerfilPadrao(
  data: PerfilPadraoCreatePayload
): Promise<PerfilPadrao> {
  const response = await apiRequest<PerfilPadraoApiResponse>({
    path: "/api/v1/admin/seguranca/perfis-padrao",
    method: "POST",
    body: data,
  });
  return normalizePerfilPadrao(response);
}

// ---------------------------------------------------------------------------
// Revisões de Segurança (endpoint já usado em revisoes/page.tsx via review board)
// ---------------------------------------------------------------------------

// Reexportado para facilidade — o endpoint é o mesmo usado em seguranca.ts
// GET /admin/seguranca/revisoes já está integrado via getGlobalSecurityReviewBoard()

// ---------------------------------------------------------------------------
// Exceções — Criar e Revisar
// ---------------------------------------------------------------------------

type ExcecaoApiResponse = Partial<GlobalAdminAccessException> & {
  id?: string | null;
  title?: string | null;
  justification?: string | null;
  expiresAt?: string | null;
  createdAt?: string | null;
  createdBy?: string | null;
  active?: unknown;
};

type RevisaoResultApiResponse = Partial<ExcecaoRevisaoResult> & {
  id?: string | null;
  excecaoId?: string | null;
  decisao?: unknown;
  comentario?: string | null;
  revisadoPor?: string | null;
  revisadoEm?: string | null;
};

function normalizeExcecao(input: ExcecaoApiResponse): GlobalAdminAccessException {
  return {
    id: cleanString(input.id) ?? "",
    title: cleanString(input.title) ?? "",
    justification: cleanString(input.justification) ?? "",
    expiresAt: cleanString(input.expiresAt),
    createdAt: cleanString(input.createdAt),
    createdBy: cleanString(input.createdBy),
    active: toBoolean(input.active, true),
  };
}

function normalizeRevisaoResult(input: RevisaoResultApiResponse): ExcecaoRevisaoResult {
  const decisao = cleanString(input.decisao as string);
  const validDecisoes = ["APROVADA", "REJEITADA", "RENOVADA"];
  return {
    id: cleanString(input.id) ?? "",
    excecaoId: cleanString(input.excecaoId) ?? "",
    decisao: validDecisoes.includes(decisao ?? "") ? (decisao as ExcecaoRevisaoResult["decisao"]) : "APROVADA",
    comentario: cleanString(input.comentario) ?? "",
    revisadoPor: cleanString(input.revisadoPor),
    revisadoEm: cleanString(input.revisadoEm),
  };
}

export async function createExcecao(
  data: ExcecaoCreatePayload
): Promise<GlobalAdminAccessException> {
  const response = await apiRequest<ExcecaoApiResponse>({
    path: "/api/v1/admin/seguranca/excecoes",
    method: "POST",
    body: data,
  });
  return normalizeExcecao(response);
}

export async function revisarExcecao(
  excecaoId: string,
  data: ExcecaoRevisaoPayload
): Promise<ExcecaoRevisaoResult> {
  const response = await apiRequest<RevisaoResultApiResponse>({
    path: `/api/v1/admin/seguranca/excecoes/${excecaoId}/revisao`,
    method: "PUT",
    body: data,
  });
  return normalizeRevisaoResult(response);
}
