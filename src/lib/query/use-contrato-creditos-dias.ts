"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  emitirContratoCreditoDiasApi,
  estornarContratoCreditoDiasApi,
  listContratoCreditosDiasApi,
  type EmitirContratoCreditoDiasApiInput,
  type EstornarContratoCreditoDiasApiInput,
} from "@/lib/api/contratos-credito-dias";
import type { ContratoCreditoDias } from "@/lib/types";
import { queryKeys } from "./keys";

export function useContratoCreditosDias(
  tenantId: string | undefined,
  contratoId: string | undefined,
  enabled = true,
) {
  return useQuery<ContratoCreditoDias[]>({
    queryKey: queryKeys.contratos.creditosDias(tenantId ?? "", contratoId ?? ""),
    queryFn: () => listContratoCreditosDiasApi({ contratoId: contratoId ?? "" }),
    enabled: Boolean(enabled && tenantId && contratoId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useEmitirContratoCreditoDias() {
  return useMutation({
    mutationFn: (input: EmitirContratoCreditoDiasApiInput) =>
      emitirContratoCreditoDiasApi(input),
  });
}

export function useEstornarContratoCreditoDias() {
  return useMutation({
    mutationFn: (input: EstornarContratoCreditoDiasApiInput) =>
      estornarContratoCreditoDiasApi(input),
  });
}
