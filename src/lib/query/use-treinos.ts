import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { extractAlunosFromListResponse, listAlunosApi } from "@/lib/api/alunos";
import {
  listTreinoExercicios,
  listTreinoGruposMusculares,
  listTreinosWorkspace,
  listTreinoTemplatesWorkspace,
  getTreinoWorkspace,
  saveTreinoExercicio,
  toggleTreinoExercicio,
  saveTreinoGrupoMuscular,
  toggleTreinoGrupoMuscular,
  encerrarTreinoWorkspace,
  type TreinoTemplateResumo,
} from "@/lib/tenant/treinos/workspace";
import type { Aluno, Exercicio, GrupoMuscular, Treino } from "@/lib/types";
import { queryKeys } from "./keys";

// ---------------------------------------------------------------------------
// Treino Detail
// ---------------------------------------------------------------------------

export interface TreinoDetailData {
  treino: Treino | null;
  exercicios: Exercicio[];
  alunos: Aluno[];
}

export function useTreinoDetail(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  treinoId: string;
}) {
  return useQuery<TreinoDetailData>({
    queryKey: queryKeys.treinos.detail(input.tenantId ?? "", input.treinoId),
    queryFn: async () => {
      const [treino, exercicios, alunosResponse] = await Promise.all([
        getTreinoWorkspace({ tenantId: input.tenantId!, id: input.treinoId }),
        listTreinoExercicios({ tenantId: input.tenantId!, ativo: true }),
        listAlunosApi({ tenantId: input.tenantId!, status: "ATIVO", page: 0, size: 200 }),
      ]);
      return {
        treino: treino ?? null,
        exercicios,
        alunos: extractAlunosFromListResponse(alunosResponse),
      };
    },
    enabled:
      Boolean(input.tenantId) &&
      input.tenantResolved &&
      Boolean(input.treinoId.trim()),
    staleTime: 2 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Treinos Atribuídos
// ---------------------------------------------------------------------------

// Wave J.3: lista de templates publicados para o modal "Atribuir treino"
// (3 passos). Cache de 60s evita re-fetch no abrir/fechar.
export function useTreinoTemplatesPublicados(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
}) {
  return useQuery<TreinoTemplateResumo[]>({
    queryKey: ["treinos", "templates-publicados", input.tenantId ?? ""],
    queryFn: async () => {
      const response = await listTreinoTemplatesWorkspace({
        tenantId: input.tenantId!,
        status: "PUBLICADO",
        page: 0,
        size: 100,
      });
      return response.items;
    },
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 60_000,
  });
}

export function useTreinosAtribuidos(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
}) {
  return useQuery<Treino[]>({
    queryKey: queryKeys.treinos.atribuidos(input.tenantId ?? ""),
    queryFn: async () => {
      const response = await listTreinosWorkspace({
        tenantId: input.tenantId!,
        tipoTreino: "CUSTOMIZADO",
        page: 0,
        size: 200,
      });
      return response.items;
    },
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 2 * 60 * 1000,
  });
}

function useInvalidateTreinos() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["treinos"] });
}

export function useEncerrarTreino() {
  const invalidate = useInvalidateTreinos();

  return useMutation({
    mutationFn: (input: { tenantId: string; id: string; observacao?: string }) =>
      encerrarTreinoWorkspace(input),
    onSuccess: () => invalidate(),
  });
}

// ---------------------------------------------------------------------------
// Exercícios
// ---------------------------------------------------------------------------

export interface ExerciciosData {
  exercicios: Exercicio[];
  gruposMusculares: GrupoMuscular[];
}

export function useExercicios(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  apenasAtivos?: boolean;
}) {
  const filters = { ativo: input.apenasAtivos };

  return useQuery<ExerciciosData>({
    queryKey: queryKeys.treinos.exercicios(input.tenantId ?? "", filters),
    queryFn: async () => {
      const [exercicios, gruposMusculares] = await Promise.all([
        listTreinoExercicios({
          tenantId: input.tenantId!,
          ativo: input.apenasAtivos ? true : undefined,
        }),
        listTreinoGruposMusculares({ tenantId: input.tenantId! }),
      ]);
      return { exercicios, gruposMusculares };
    },
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 2 * 60 * 1000,
  });
}

function useInvalidateExercicios() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["treinos", "exercicios"] });
}

export function useSaveExercicio() {
  const invalidate = useInvalidateExercicios();

  return useMutation({
    mutationFn: (input: Parameters<typeof saveTreinoExercicio>[0]) =>
      saveTreinoExercicio(input),
    onSuccess: () => invalidate(),
  });
}

export function useToggleExercicio() {
  const invalidate = useInvalidateExercicios();

  return useMutation({
    mutationFn: (input: { tenantId: string; id: string }) =>
      toggleTreinoExercicio(input),
    onSuccess: () => invalidate(),
  });
}

// ---------------------------------------------------------------------------
// Grupos Musculares
// ---------------------------------------------------------------------------

export interface GruposMuscularesData {
  grupos: GrupoMuscular[];
  exercicios: Exercicio[];
}

export function useGruposMusculares(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
}) {
  return useQuery<GruposMuscularesData>({
    queryKey: queryKeys.treinos.gruposMusculares(input.tenantId ?? ""),
    queryFn: async () => {
      const [grupos, exercicios] = await Promise.all([
        listTreinoGruposMusculares({ tenantId: input.tenantId! }),
        listTreinoExercicios({ tenantId: input.tenantId! }),
      ]);
      return { grupos, exercicios };
    },
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 2 * 60 * 1000,
  });
}

function useInvalidateGruposMusculares() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["treinos", "gruposMusculares"] });
}

export function useSaveGrupoMuscular() {
  const invalidate = useInvalidateGruposMusculares();

  return useMutation({
    mutationFn: (input: Parameters<typeof saveTreinoGrupoMuscular>[0]) =>
      saveTreinoGrupoMuscular(input),
    onSuccess: () => invalidate(),
  });
}

export function useToggleGrupoMuscular() {
  const invalidate = useInvalidateGruposMusculares();

  return useMutation({
    mutationFn: (input: { tenantId: string; id: string }) =>
      toggleTreinoGrupoMuscular(input),
    onSuccess: () => invalidate(),
  });
}
