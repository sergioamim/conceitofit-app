import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listGlobalAcademias,
  getGlobalAcademiaById,
  createGlobalAcademia,
  updateGlobalAcademia,
  createGlobalUnidade,
  updateGlobalUnidade,
  toggleGlobalUnidade,
  deleteGlobalUnidade,
  listGlobalUnidades,
} from "@/backoffice/lib/admin";
import type { Academia, Tenant } from "@/lib/types";
import { queryKeys } from "@/lib/query/keys";

export function useAdminAcademias() {
  return useQuery<Academia[]>({
    queryKey: queryKeys.admin.academias.list(),
    queryFn: () => listGlobalAcademias(),
  });
}

export function useAdminAcademiaDetail(id: string) {
  return useQuery<Academia | null>({
    queryKey: queryKeys.admin.academias.detail(id),
    queryFn: () => getGlobalAcademiaById(id),
    enabled: Boolean(id),
  });
}

export function useAdminUnidades() {
  return useQuery<Tenant[]>({
    queryKey: queryKeys.admin.unidades.list(),
    queryFn: () => listGlobalUnidades(),
  });
}

export function useCreateAcademia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Academia>) => createGlobalAcademia(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.academias.all() });
    },
  });
}

export function useUpdateAcademia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Academia> }) =>
      updateGlobalAcademia(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.academias.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.unidades.all() });
    },
  });
}

export function useCreateUnidade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Tenant>) => createGlobalUnidade(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.unidades.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.academias.all() });
    },
  });
}

export function useUpdateUnidade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tenant> }) =>
      updateGlobalUnidade(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.unidades.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.academias.all() });
    },
  });
}

export function useToggleUnidade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleGlobalUnidade(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.unidades.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.academias.all() });
    },
  });
}

export function useDeleteUnidade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGlobalUnidade(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.unidades.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.academias.all() });
    },
  });
}
