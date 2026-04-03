import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDashboardFinanceiroAdmin,
  listAdminCobrancas,
  createAdminCobranca,
  baixarAdminCobranca,
  cancelarAdminCobranca,
  listAdminContratos,
  createAdminContrato,
  updateAdminContrato,
  suspenderAdminContrato,
  reativarAdminContrato,
  listAdminPlanos,
  createAdminPlano,
  updateAdminPlano,
  toggleAdminPlano,
} from "@/backoffice/api/admin-billing";
import {
  listAdminGateways,
  createAdminGateway,
  updateAdminGateway,
  ativarAdminGateway,
  desativarAdminGateway,
} from "@/backoffice/api/admin-gateways";
import { listGlobalAcademias } from "@/backoffice/lib/admin";
import type {
  Academia,
  Cobranca,
  ContratoPlataforma,
  DashboardFinanceiroAdmin,
  DashboardFinanceiroPeriodo,
  GatewayPagamento,
  PlanoPlataforma,
} from "@/lib/types";
import { queryKeys } from "@/lib/query/keys";

// ── Dashboard Financeiro ──────────────────────────────────────────────

export function useAdminFinanceiroDashboard(
  periodo: DashboardFinanceiroPeriodo = "12M",
) {
  return useQuery<DashboardFinanceiroAdmin>({
    queryKey: queryKeys.admin.financeiro.dashboard(periodo),
    queryFn: () => getDashboardFinanceiroAdmin(periodo),
  });
}

// ── Cobranças ─────────────────────────────────────────────────────────

export function useAdminCobrancas() {
  return useQuery<Cobranca[]>({
    queryKey: queryKeys.admin.financeiro.cobrancas(),
    queryFn: () => listAdminCobrancas(),
  });
}

export function useCreateAdminCobranca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAdminCobranca,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.financeiro.cobrancas() });
    },
  });
}

export function useBaixarAdminCobranca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof baixarAdminCobranca>[1] }) =>
      baixarAdminCobranca(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.financeiro.cobrancas() });
    },
  });
}

export function useCancelarAdminCobranca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelarAdminCobranca(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.financeiro.cobrancas() });
    },
  });
}

// ── Contratos ─────────────────────────────────────────────────────────

export function useAdminContratos() {
  return useQuery<ContratoPlataforma[]>({
    queryKey: queryKeys.admin.financeiro.contratos(),
    queryFn: () => listAdminContratos(),
  });
}

export function useAdminContratosAcademias() {
  return useQuery<Academia[]>({
    queryKey: queryKeys.admin.academias.list(),
    queryFn: () => listGlobalAcademias(),
  });
}

export function useCreateAdminContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAdminContrato,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.financeiro.contratos() });
    },
  });
}

export function useUpdateAdminContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAdminContrato>[1] }) =>
      updateAdminContrato(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.financeiro.contratos() });
    },
  });
}

export function useSuspenderAdminContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo?: string }) =>
      suspenderAdminContrato(id, motivo),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.financeiro.contratos() });
    },
  });
}

export function useReativarAdminContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reativarAdminContrato(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.financeiro.contratos() });
    },
  });
}

// ── Planos ────────────────────────────────────────────────────────────

export function useAdminPlanos() {
  return useQuery<PlanoPlataforma[]>({
    queryKey: queryKeys.admin.financeiro.planos(),
    queryFn: () => listAdminPlanos(),
  });
}

export function useCreateAdminPlano() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAdminPlano,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.financeiro.planos() });
    },
  });
}

export function useUpdateAdminPlano() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAdminPlano>[1] }) =>
      updateAdminPlano(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.financeiro.planos() });
    },
  });
}

export function useToggleAdminPlano() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleAdminPlano(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.financeiro.planos() });
    },
  });
}

// ── Gateways ──────────────────────────────────────────────────────────

export function useAdminGateways() {
  return useQuery<GatewayPagamento[]>({
    queryKey: queryKeys.admin.financeiro.gateways(),
    queryFn: () => listAdminGateways(),
  });
}

export function useCreateAdminGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAdminGateway,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.financeiro.gateways() });
    },
  });
}

export function useUpdateAdminGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAdminGateway>[1] }) =>
      updateAdminGateway(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.financeiro.gateways() });
    },
  });
}

export function useToggleAdminGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (gateway: GatewayPagamento) =>
      gateway.ativo ? desativarAdminGateway(gateway.id) : ativarAdminGateway(gateway.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.financeiro.gateways() });
    },
  });
}
