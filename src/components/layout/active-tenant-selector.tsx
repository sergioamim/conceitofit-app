"use client";

import { Building2, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_ACTIVE_TENANT_LABEL, DEFAULT_BASE_TENANT_LABEL } from "@/hooks/use-session-context";
import type { Tenant, TenantOperationalEligibility } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  baseTenantId = "",
  baseTenantName = DEFAULT_BASE_TENANT_LABEL,
  networkName,
  availableScopes = [],
  broadAccess = false,
  blockedTenants = [],
  ready = false,
  disabled = false,
  onChange,
}: ActiveTenantSelectorProps) {
  const hasTenantOptions = tenants.length > 0;
  const resolvedTenantName =
    ready && tenantName.trim() ? tenantName : DEFAULT_ACTIVE_TENANT_LABEL;
  const normalizedTenantId = tenantId.trim();
  const selectedTenant = normalizedTenantId
    ? tenants.find((tenant) => tenant.id === normalizedTenantId)
    : undefined;
  const selectValue = ready ? selectedTenant?.id : undefined;
  const selectLabel = selectedTenant?.nome ?? "Selecionar unidade";
  const normalizedBaseTenantId = baseTenantId.trim();
  const hasDistinctBaseTenant =
    Boolean(normalizedBaseTenantId) && normalizedBaseTenantId !== normalizedTenantId;
  const scopeLabel = availableScopes.length > 0 ? availableScopes.join(" · ") : "UNIDADE";
  const blockedSummary = blockedTenants
    .slice(0, 2)
    .map((tenant) => {
      const reason = tenant.blockedReasons[0]?.message;
      return reason
        ? `${tenant.tenantName ?? tenant.tenantId}: ${reason}`
        : (tenant.tenantName ?? tenant.tenantId);
    })
    .join(" • ");
  const showSwitch = ready && tenants.length > 1;

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:flex-row sm:items-center">
      <Building2 className="size-4 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Unidade ativa</p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              broadAccess
                ? "bg-gym-danger/10 text-gym-danger"
                : "bg-secondary text-muted-foreground"
            )}
          >
            {scopeLabel}
          </span>
          {networkName ? (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {networkName}
            </span>
          ) : null}
        </div>
        <p className="truncate text-sm font-medium text-foreground">{resolvedTenantName}</p>
        {hasDistinctBaseTenant ? (
          <p className="truncate text-xs text-muted-foreground">Base estrutural: {baseTenantName}</p>
        ) : null}
        {blockedSummary ? (
          <p className="line-clamp-2 text-xs text-amber-300">Indisponíveis no momento: {blockedSummary}</p>
        ) : null}
      </div>
      {showSwitch ? (
        <Select
          value={selectValue}
          onValueChange={onChange}
          disabled={disabled || !hasTenantOptions}
        >
          <SelectTrigger
            className="h-8 w-full border-border bg-secondary sm:w-[220px]"
            aria-label="Selecionar unidade ativa"
          >
            <SelectValue placeholder="Selecionar unidade" />
          </SelectTrigger>
          <SelectContent className="border-border bg-card">
            {tenants.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : ready ? (
        <div className="border-input text-muted-foreground flex h-8 w-full items-center justify-between gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm shadow-xs sm:w-[220px]">
          <span className={selectValue ? "truncate text-foreground" : "truncate"}>
            {selectValue ? selectLabel : resolvedTenantName}
          </span>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Selecionar unidade ativa"
          disabled
          className="border-input text-muted-foreground flex h-8 w-full items-center justify-between gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm shadow-xs disabled:cursor-not-allowed disabled:opacity-50 sm:w-[220px]"
        >
          <span className={selectValue ? "truncate text-foreground" : "truncate"}>
            {selectValue ? selectLabel : "Selecionar unidade"}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </button>
      )}
    </div>
  );
}
