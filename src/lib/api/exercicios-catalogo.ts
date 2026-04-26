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
