import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  buscarCatalogoExerciciosApi,
  importarBatchExerciciosApi,
  importarExercicioCatalogoApi,
  sanitizeBibliotecaApi,
  type ImportarBatchExerciciosResponse,
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
  /** Wave D.1: filtra apenas itens com gif/imagem carregando. */
  comImagem?: boolean;
  /** Wave D.2: pagina (default 0). */
  page?: number;
  /** Wave D.2: tamanho da página (default 24). */
  size?: number;
}

/**
 * Lista o catálogo global de exercícios (ExerciseDB) com filtros básicos
 * e paginação. Tamanho default 24 = grid 4x6 confortável na modal.
 */
export function useCatalogoExercicios(filtros: CatalogoExerciciosFilters) {
  return useQuery<CatalogoExercicioPage>({
    queryKey: ["catalogo-exercicios", filtros],
    queryFn: () =>
      buscarCatalogoExerciciosApi({
        ...filtros,
        page: filtros.page ?? 0,
        size: filtros.size ?? 24,
      }),
    enabled: true,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

function invalidateBiblioteca(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["treinos", "exercicios"] });
  queryClient.invalidateQueries({ queryKey: ["exercicios", "biblioteca"] });
  queryClient.invalidateQueries({ queryKey: ["exercicios"] });
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
    onSuccess: () => invalidateBiblioteca(queryClient),
  });
}

/** Wave D.2: importa N exercícios em uma única transação. */
export function useImportarBatchExercicios(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation<ImportarBatchExerciciosResponse, unknown, string[]>({
    mutationFn: (exerciseIdsExternos) =>
      importarBatchExerciciosApi({ tenantId, exerciseIdsExternos }),
    onSuccess: () => invalidateBiblioteca(queryClient),
  });
}

/** Wave D.4: sanitiza biblioteca local (soft delete em massa). */
export function useSanitizeBiblioteca(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ totalRemovidos: number }, unknown, void>({
    mutationFn: () => sanitizeBibliotecaApi({ tenantId }),
    onSuccess: () => invalidateBiblioteca(queryClient),
  });
}
