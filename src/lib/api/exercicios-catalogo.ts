/**
 * Adapter HTTP para o catálogo global de exercícios (ExerciseDB).
 *
 * Endpoints:
 * - GET  /api/v1/exercicios/catalogo-global
 * - POST /api/v1/exercicios/catalogo-global/importar?tenantId=X
 */

import type {
  CatalogoExercicioPage,
  ImportarExercicioPayload,
  ImportarExercicioResponse,
} from "@/lib/shared/types/exercicio-catalogo";
import { apiRequest } from "./http";

export interface BuscarCatalogoExerciciosInput {
  search?: string;
  bodyPart?: string;
  equipment?: string;
  /** Wave D.1: filtra apenas itens com gif_url ou image_url preenchidos. */
  comImagem?: boolean;
  page?: number;
  size?: number;
}

export async function buscarCatalogoExerciciosApi(
  input: BuscarCatalogoExerciciosInput,
): Promise<CatalogoExercicioPage> {
  return apiRequest<CatalogoExercicioPage>({
    path: "/api/v1/exercicios/catalogo-global",
    query: {
      search: input.search,
      bodyPart: input.bodyPart,
      equipment: input.equipment,
      comImagem: input.comImagem ? true : undefined,
      page: input.page,
      size: input.size ?? 20,
    },
  });
}

export interface ImportarExercicioCatalogoInput {
  tenantId: string;
  payload: ImportarExercicioPayload;
}

export async function importarExercicioCatalogoApi(
  input: ImportarExercicioCatalogoInput,
): Promise<ImportarExercicioResponse> {
  return apiRequest<ImportarExercicioResponse>({
    path: "/api/v1/exercicios/catalogo-global/importar",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.payload,
  });
}

/** Wave D.1: importa N exercícios em uma transação. */
export interface ImportarBatchExerciciosInput {
  tenantId: string;
  exerciseIdsExternos: string[];
}

export interface ImportarBatchExerciciosResponse {
  totalImportados: number;
  itens: Array<{ exercicioId: string; nome: string; exerciseIdExterno: string | null }>;
}

export async function importarBatchExerciciosApi(
  input: ImportarBatchExerciciosInput,
): Promise<ImportarBatchExerciciosResponse> {
  return apiRequest<ImportarBatchExerciciosResponse>({
    path: "/api/v1/exercicios/catalogo-global/importar-batch",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: { exerciseIdsExternos: input.exerciseIdsExternos },
  });
}

/** Wave D.1: sanitiza biblioteca local (soft delete em massa). */
export async function sanitizeBibliotecaApi(input: {
  tenantId: string;
}): Promise<{ totalRemovidos: number }> {
  return apiRequest<{ totalRemovidos: number }>({
    path: "/api/v1/exercicios/sanitize",
    method: "DELETE",
    query: { tenantId: input.tenantId },
  });
}
