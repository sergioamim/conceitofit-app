/**
 * Service de Vínculos Agregador (B2B).
 *
 * Consome `POST /api/v1/agregadores/vinculos` (PR backend #4) para criar
 * vínculos permanentes entre alunos e agregadores B2B (Wellhub/Gympass,
 * TotalPass, Outros). Implementa tratamento de erros específicos:
 *
 * - 422 → aluno não existe
 * - 409 → vínculo duplicado para o mesmo agregador
 * - 400 → validação (ex: usuarioExternoId inválido)
 *
 * Story: VUN-5.2 (Modal Vincular Agregador).
 */
import { ApiRequestError, apiRequest } from "./http";

// ─── Types ─────────────────────────────────────────────────────────────────

export type AgregadorTipo = "WELLHUB" | "TOTALPASS" | "OUTRO";

export type AgregadorVinculoStatus = "ATIVO" | "INATIVO" | "SUSPENSO";

export interface AgregadorVinculoResponse {
  id: string;
  tenantId: string;
  alunoId: string;
  agregador: AgregadorTipo;
  usuarioExternoId: string;
  customCode?: string | null;
  status: AgregadorVinculoStatus;
  dataInicio: string;
  dataFim?: string | null;
  cicloExpiraEm?: string | null;
  ultimaVisitaEm?: string | null;
}

export interface PostAgregadorVinculoInput {
  tenantId: string;
  alunoId: string;
  agregador: AgregadorTipo;
  usuarioExternoId: string;
  customCode?: string;
  /** Formato YYYY-MM-DD. */
  dataInicio: string;
}

export interface PutAgregadorVinculoInput {
  tenantId: string;
  vinculoId: string;
  usuarioExternoId: string;
  customCode?: string;
  status: AgregadorVinculoStatus;
  dataInicio?: string;
  dataFim?: string;
}

// ─── Error mapper ──────────────────────────────────────────────────────────

/**
 * Mensagens amigáveis por status HTTP. Mantém a mensagem do backend quando
 * presente (`fieldErrors` ou `message`), com fallback por código.
 */
function mapVinculoError(error: ApiRequestError): Error {
  const backendMessage = error.message?.trim();

  if (error.status === 422) {
    return new Error(
      backendMessage && backendMessage !== `HTTP 422`
        ? backendMessage
        : "Aluno não encontrado para vincular ao agregador.",
    );
  }
  if (error.status === 409) {
    return new Error(
      backendMessage && backendMessage !== `HTTP 409`
        ? backendMessage
        : "Já existe um vínculo usando esse identificador externo neste agregador.",
    );
  }
  if (error.status === 400) {
    return new Error(
      backendMessage && backendMessage !== `HTTP 400`
        ? backendMessage
        : "Dados inválidos para criar o vínculo. Verifique os campos.",
    );
  }
  return new Error(backendMessage || "Falha ao criar vínculo agregador.");
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Lista vínculos de um aluno com agregadores B2B.
 *
 * Por padrão retorna só os ativos; o perfil pode solicitar também os
 * inativos para manter edição/reativação disponível sem recriar vínculo.
 */
export async function listAgregadorVinculosDoAluno(input: {
  tenantId: string;
  alunoId: string;
  incluirInativos?: boolean;
}): Promise<AgregadorVinculoResponse[]> {
  try {
    return await apiRequest<AgregadorVinculoResponse[]>({
      path: "/api/v1/agregadores/vinculos",
      query: {
        tenantId: input.tenantId,
        alunoId: input.alunoId,
        incluirInativos: input.incluirInativos ? "true" : undefined,
      },
    });
  } catch {
    // Falhas silenciosas — o perfil renderiza o card principal mesmo sem
    // dados de agregador.
    return [];
  }
}

/**
 * Cria um vínculo permanente entre um aluno e um agregador B2B.
 *
 * @throws Error com mensagem amigável (mapeada de 400/409/422 ou genérica).
 */
export async function postAgregadorVinculo(
  input: PostAgregadorVinculoInput,
): Promise<AgregadorVinculoResponse> {
  try {
    return await apiRequest<AgregadorVinculoResponse>({
      path: "/api/v1/agregadores/vinculos",
      method: "POST",
      query: { tenantId: input.tenantId },
      body: {
        tenantId: input.tenantId,
        alunoId: input.alunoId,
        agregador: input.agregador,
        usuarioExternoId: input.usuarioExternoId,
        customCode: input.customCode,
        dataInicio: input.dataInicio,
      },
    });
  } catch (err) {
    if (err instanceof ApiRequestError) {
      throw mapVinculoError(err);
    }
    throw err;
  }
}

/**
 * Atualiza ou inativa um vínculo B2B já existente.
 */
export async function putAgregadorVinculo(
  input: PutAgregadorVinculoInput,
): Promise<AgregadorVinculoResponse> {
  try {
    return await apiRequest<AgregadorVinculoResponse>({
      path: `/api/v1/agregadores/vinculos/${encodeURIComponent(input.vinculoId)}`,
      method: "PUT",
      query: { tenantId: input.tenantId },
      body: {
        tenantId: input.tenantId,
        usuarioExternoId: input.usuarioExternoId,
        customCode: input.customCode,
        status: input.status,
        dataInicio: input.dataInicio,
        dataFim: input.dataFim,
      },
    });
  } catch (err) {
    if (err instanceof ApiRequestError) {
      throw mapVinculoError(err);
    }
    throw err;
  }
}
