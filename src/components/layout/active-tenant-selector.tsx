"use client";

import { Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_ACTIVE_TENANT_LABEL } from "@/hooks/use-session-context";
import type { Tenant } from "@/lib/types";

type ActiveTenantSelectorProps = {
  tenantId: string;
  tenantName: string;
  tenants: Tenant[];
  disabled?: boolean;
  onChange: (tenantId: string) => void | Promise<void>;
};

export function ActiveTenantSelector({
  tenantId,
  tenantName,
  tenants,
  disabled = false,
  onChange,
}: ActiveTenantSelectorProps) {
  const hasTenantOptions = tenants.length > 0;
  const resolvedTenantName = tenantName.trim() || DEFAULT_ACTIVE_TENANT_LABEL;

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:flex-row sm:items-center">
      <Building2 className="size-4 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Unidade ativa</p>
        <p className="truncate text-sm font-medium text-foreground">{resolvedTenantName}</p>
      </div>
      <Select
        value={tenantId || undefined}
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
    </div>
  );
}
