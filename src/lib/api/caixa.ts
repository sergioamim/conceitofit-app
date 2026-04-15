/**
 * Cliente HTTP tipado para o domínio Caixa Operacional.
 *
 * Espelha os endpoints `CaixaController` do backend em
 * `modulo-financeiro/src/main/java/fit/conceito/financeiro/controller/`.
 *
 * Base path: `/api/caixas`. `tenantId`/`operadorId` são resolvidos no backend
 * via JWT + tenant context (`http.ts` injeta automaticamente).
 *
 * Erros 4xx com payload `{ code: CaixaErrorCode, ... }` são re-lançados como
 * `CaixaApiError` (discriminated union) — ver `./caixa-error-handler.ts` para
 * apresentação user-friendly.
 */

import type {
  AbrirCaixaRequest,
  AjusteAdminRequest,
  CaixaResponse,
  DashboardDiarioResponse,
  DiferencaItemResponse,
  FecharCaixaRequest,
  FecharCaixaResponse,
  MovimentoResumoResponse,
  SaldoParcialResponse,
  SangriaRequest,
} from "./caixa.types";
import type { CaixaApiError } from "./caixa-errors";
import {
  ApiRequestError,
  apiRequest,
  apiRequestWithMeta,
} from "./http";

// ---------------------------------------------------------------------------
// Error normalization
// ---------------------------------------------------------------------------

/**
 * Tenta extrair um `CaixaApiError` do `responseBody` bruto do
 * `ApiRequestError`. Quando o BE retorna `{ code: 'CAIXA_JA_ABERTO', ... }`
 * em um 4xx, relançamos como objeto tipado para a UI consumir via
 * `mapCaixaError()`.
 */
function tryExtractCaixaApiError(error: ApiRequestError): CaixaApiError | null {
  if (!error.responseBody) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(error.responseBody);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const candidate = parsed as Record<string, unknown>;
  const code = candidate.code;
  if (typeof code !== "string") return null;
  switch (code) {
    case "CAIXA_JA_ABERTO":
      if (
        typeof candidate.caixaAtivoId === "string" &&
        typeof candidate.abertoEm === "string"
      ) {
        return {
          code,
          caixaAtivoId: candidate.caixaAtivoId,
          abertoEm: candidate.abertoEm,
        };
      }
      return null;
    case "CAIXA_NAO_ABERTO":
      return {
        code,
        acaoSugerida: "ABRIR_CAIXA",
        caixaCatalogoSugerido:
          typeof candidate.caixaCatalogoSugerido === "string"
            ? candidate.caixaCatalogoSugerido
            : null,
      };
    case "CAIXA_DIA_ANTERIOR":
      if (
        typeof candidate.caixaAtivoId === "string" &&
        typeof candidate.abertoEm === "string"
      ) {
        return {
          code,
          caixaAtivoId: candidate.caixaAtivoId,
          abertoEm: candidate.abertoEm,
          acaoSugerida: "FECHAR_E_REABRIR",
        };
      }
      return null;
    case "SANGRIA_SEM_AUTORIZACAO":
      return { code };
    case "CAIXA_JA_FECHADO":
      return { code };
    default:
      return null;
  }
}

/**
 * Executa `op()` e, em caso de `ApiRequestError`, tenta re-lançar como
 * `CaixaApiError` (discriminated union) quando o payload corresponde.
 * Caso contrário re-lança o erro original.
 */
async function withCaixaErrorMapping<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const caixaError = tryExtractCaixaApiError(error);
      if (caixaError) throw caixaError;
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/** `POST /api/caixas/abrir` → 201 `CaixaResponse`. */
export async function abrirCaixa(
  req: AbrirCaixaRequest,
): Promise<CaixaResponse> {
  return withCaixaErrorMapping(() =>
    apiRequest<CaixaResponse>({
      path: "/api/caixas/abrir",
      method: "POST",
      body: req,
    }),
  );
}

/**
 * `GET /api/caixas/ativo` → 200 `{ caixa, saldo }` OU 204 sem caixa.
 * Retorna `null` quando 204 (body vazio).
 */
export async function getCaixaAtivo(): Promise<
  { caixa: CaixaResponse; saldo: SaldoParcialResponse } | null
> {
  const response = await apiRequestWithMeta<{
    caixa: CaixaResponse;
    saldo: SaldoParcialResponse;
  } | null>({
    path: "/api/caixas/ativo",
    method: "GET",
  });
  if (response.data == null) return null;
  if (typeof response.data !== "object") return null;
  if (!("caixa" in response.data) || !("saldo" in response.data)) return null;
  return response.data;
}

/** `POST /api/caixas/{id}/fechar` → 200 `FecharCaixaResponse`. */
export async function fecharCaixa(
  id: string,
  req: FecharCaixaRequest,
): Promise<FecharCaixaResponse> {
  return withCaixaErrorMapping(() =>
    apiRequest<FecharCaixaResponse>({
      path: `/api/caixas/${encodeURIComponent(id)}/fechar`,
      method: "POST",
      body: req,
    }),
  );
}

/** `POST /api/caixas/{id}/sangria` → 201 `{ sangria, movimento }`. */
export async function criarSangria(
  id: string,
  req: SangriaRequest,
): Promise<{ sangria: unknown; movimento: MovimentoResumoResponse }> {
  return withCaixaErrorMapping(() =>
    apiRequest<{ sangria: unknown; movimento: MovimentoResumoResponse }>({
      path: `/api/caixas/${encodeURIComponent(id)}/sangria`,
      method: "POST",
      body: req,
    }),
  );
}

/** `GET /api/caixas?status=&operadorId=&from=&to=` → 200 `CaixaResponse[]`. */
export async function listarCaixas(filter: {
  status?: string;
  operadorId?: string;
  from?: string;
  to?: string;
}): Promise<CaixaResponse[]> {
  return apiRequest<CaixaResponse[]>({
    path: "/api/caixas",
    method: "GET",
    query: {
      status: filter.status,
      operadorId: filter.operadorId,
      from: filter.from,
      to: filter.to,
    },
  });
}

/** `GET /api/caixas/dashboard?data=YYYY-MM-DD` → 200 `DashboardDiarioResponse`. */
export async function getDashboard(
  data: string,
): Promise<DashboardDiarioResponse> {
  return apiRequest<DashboardDiarioResponse>({
    path: "/api/caixas/dashboard",
    method: "GET",
    query: { data },
  });
}

/** `GET /api/caixas/diferencas?from=&to=&operadorId=` → 200 `DiferencaItemResponse[]` (GERENTE+). */
export async function getDiferencas(filter: {
  from?: string;
  to?: string;
  operadorId?: string;
}): Promise<DiferencaItemResponse[]> {
  return apiRequest<DiferencaItemResponse[]>({
    path: "/api/caixas/diferencas",
    method: "GET",
    query: {
      from: filter.from,
      to: filter.to,
      operadorId: filter.operadorId,
    },
  });
}

/** `POST /api/caixas/{id}/movimentos/ajuste-admin` → 201 `MovimentoResumoResponse` (ADMIN). */
export async function ajusteAdmin(
  id: string,
  req: AjusteAdminRequest,
): Promise<MovimentoResumoResponse> {
  return withCaixaErrorMapping(() =>
    apiRequest<MovimentoResumoResponse>({
      path: `/api/caixas/${encodeURIComponent(id)}/movimentos/ajuste-admin`,
      method: "POST",
      body: req,
    }),
  );
}
