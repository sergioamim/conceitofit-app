/**
 * API client da feature "instância customizada de template" (Wave 4 PRD V3).
 *
 * Cada aluno pode ter um overlay de patches sobre um template baseline.
 * Backend armazena overrides em JSONB; FE faz o merge "template + overlay"
 * e computa `_isCustom` por campo para diff visual amarelo.
 */

import { apiRequest } from "./http";

export type OverrideTipo = "MODIFY" | "ADD" | "REMOVE" | "REPLACE";

export interface InstanciaOverride {
  tipo: OverrideTipo;
  sessaoId: string;
  exercicioItemId?: string;
  campo?: string; // MODIFY: 'series'|'reps'|'carga'|'descanso'|'cadencia'|'rir'|'obs'
  valor?: string | number | null;
  // ADD: insere exercício novo
  afterItemId?: string | null;
  exercicio?: {
    exercicioCatalogoId: string;
    series?: number;
    reps?: string;
    carga?: string;
    intervalo?: string;
    cadencia?: string;
    rir?: number;
  };
  // REPLACE: troca exercício mantendo configuração
  novoExercicioCatalogoId?: string;
}

export interface TreinoInstanciaCustomizada {
  id: string;
  tenantId: string;
  templateId: string;
  alunoId: string;
  atribuicaoId?: string;
  overrides: InstanciaOverride[];
  autorId: string;
  criadoEm: string;
  atualizadoEm: string;
}

export async function listInstanciasByAluno(alunoId: string): Promise<TreinoInstanciaCustomizada[]> {
  return apiRequest<TreinoInstanciaCustomizada[]>({
    path: "/api/v1/treinos/instancias",
    query: { alunoId },
  });
}

export async function listInstanciasByTemplate(
  templateId: string,
): Promise<TreinoInstanciaCustomizada[]> {
  return apiRequest<TreinoInstanciaCustomizada[]>({
    path: "/api/v1/treinos/instancias",
    query: { templateId },
  });
}

export async function getInstancia(id: string): Promise<TreinoInstanciaCustomizada> {
  return apiRequest<TreinoInstanciaCustomizada>({
    path: `/api/v1/treinos/instancias/${id}`,
  });
}

export async function criarInstancia(input: {
  templateId: string;
  alunoId: string;
  atribuicaoId?: string;
  autorId?: string;
}): Promise<TreinoInstanciaCustomizada> {
  return apiRequest<TreinoInstanciaCustomizada>({
    path: "/api/v1/treinos/instancias",
    method: "POST",
    body: input,
  });
}

export async function aplicarOverrides(
  id: string,
  overrides: InstanciaOverride[],
): Promise<TreinoInstanciaCustomizada> {
  return apiRequest<TreinoInstanciaCustomizada>({
    path: `/api/v1/treinos/instancias/${id}/overrides`,
    method: "PATCH",
    body: { overrides },
  });
}

export async function removerInstancia(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/treinos/instancias/${id}`,
    method: "DELETE",
  });
}
