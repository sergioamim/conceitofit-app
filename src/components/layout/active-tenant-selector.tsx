"use client";

import { Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_ACTIVE_TENANT_LABEL } from "@/lib/tenant/hooks/use-session-context";
import type { Tenant, TenantOperationalEligibility } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Seletor enxuto da unidade ativa. Mostra apenas o nome da unidade + dropdown
 * discreto pra trocar. A topbar é estreita e "unidade ativa" é auto-evidente
 * pelo contexto (o valor visível é a unidade ativa; se clicar e trocar, vira
 * a ativa). Removido:
 *   - label "UNIDADE ATIVA"
 *   - badge do scope ("UNIDADE") e nome da rede
 *   - texto "Base estrutural: …" (duplicava informação útil só em casos raros)
 *   - resumo de tenants bloqueados (migra pro dropdown/menu dedicado)
 */
type ActiveTenantSelectorProps = {
  tenantId: string;
  tenantName: string;
  tenants: Tenant[];
  baseTenantId?: string;
  baseTenantName?: string;
  networkName?: string;
  availableScopes?: string[];
  broadAccess?: boolean;
  blockedTenants?: TenantOperationalEligibility[];
  ready?: boolean;
  disabled?: boolean;
  onChange: (tenantId: string) => void | Promise<void>;
};

export function ActiveTenantSelector({
  tenantId,
  tenantName,
  tenants,
  ready = false,
  disabled = false,
  onChange,
}: ActiveTenantSelectorProps) {
  const resolvedTenantName =
    ready && tenantName.trim() ? tenantName : DEFAULT_ACTIVE_TENANT_LABEL;
  const normalizedTenantId = tenantId.trim();
  const selectedTenant = normalizedTenantId
    ? tenants.find((tenant) => tenant.id === normalizedTenantId)
    : undefined;
  const selectValue = ready ? selectedTenant?.id : undefined;
  const canSwitch = ready && tenants.length > 1;

  // Quando só há uma unidade (ou ainda não carregou), não renderiza dropdown —
  // apenas o nome em texto leve com ícone. Evita UI ativo sem ação possível.
  if (!canSwitch) {
    return (
      <div
        className={cn(
          "flex h-9 items-center gap-2 rounded-md border border-transparent px-2",
          "text-sm text-foreground",
        )}
      >
        <Building2 className="size-4 shrink-0 text-muted-foreground" />
        <span className="max-w-[220px] truncate font-medium">{resolvedTenantName}</span>
      </div>
    );
  }

  return (
    <Select value={selectValue} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className="h-9 gap-2 border-border bg-transparent px-2 text-sm font-medium hover:bg-secondary/40"
        aria-label="Trocar unidade ativa"
      >
        <Building2 className="size-4 shrink-0 text-muted-foreground" />
        <SelectValue placeholder="Selecionar unidade">
          <span className="max-w-[220px] truncate">{resolvedTenantName}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="border-border bg-card">
        {tenants.map((tenant) => (
          <SelectItem key={tenant.id} value={tenant.id}>
            {tenant.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
