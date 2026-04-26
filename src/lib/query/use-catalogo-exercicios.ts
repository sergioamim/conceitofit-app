import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  buscarCatalogoExerciciosApi,
  importarExercicioCatalogoApi,
} from "@/lib/api/exercicios-catalogo";
import type {
  CatalogoExercicioPage,
  ImportarExercicioPayload,
  ImportarExercicioResponse,
} from "@/lib/shared/types/exercicio-catalogo";

export interface CatalogoExerciciosFilters {
  search?: string;
  bodyPart?: string;
  equipment?: string;
}

/**
 * Lista o catálogo global de exercícios (ExerciseDB) com filtros básicos.
 * Paginação fixa em 30 itens por página — UI puxa só a primeira página por enquanto.
 */
export function useCatalogoExercicios(filtros: CatalogoExerciciosFilters) {
  return useQuery<CatalogoExercicioPage>({
    queryKey: ["catalogo-exercicios", filtros],
    queryFn: () =>
      buscarCatalogoExerciciosApi({ ...filtros, page: 0, size: 30 }),
    enabled: true,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/**
 * Importa um exercício do catálogo global pra biblioteca local do tenant,
 * invalidando a lista de exercícios da biblioteca após sucesso.
 */
export function useImportarExercicio(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation<ImportarExercicioResponse, unknown, ImportarExercicioPayload>({
    mutationFn: (payload) =>
      importarExercicioCatalogoApi({ tenantId, payload }),
    onSuccess: () => {
      // Invalida queries de exercícios da biblioteca (treinos.exercicios + variações).
      queryClient.invalidateQueries({ queryKey: ["treinos", "exercicios"] });
      queryClient.invalidateQueries({ queryKey: ["exercicios", "biblioteca"] });
    },
  });
}
