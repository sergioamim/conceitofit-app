"use client";

import { memo, useState } from "react";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActiveTenantSelector } from "@/components/layout/active-tenant-selector";
import { useTenantContext } from "@/hooks/use-session-context";

type AppTopbarProps = {
  onOpenMenu?: () => void;
  shellReady?: boolean;
};

function AppTopbarComponent({ onOpenMenu, shellReady = false }: AppTopbarProps) {
  const [savingTenant, setSavingTenant] = useState(false);
  const {
    tenantId,
    tenantName,
    eligibleTenants,
    baseTenantId,
    baseTenantName,
    blockedTenants,
    networkName,
    availableScopes,
    broadAccess,
    setTenant,
    loading: tenantLoading,
  } = useTenantContext();

  async function handleChangeTenant(nextId: string) {
    setSavingTenant(true);
    try {
      await setTenant(nextId);
    } finally {
      setSavingTenant(false);
    }
  }

  return (
    <div className="border-b border-border px-3 py-3 md:px-7">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 md:hidden"
            aria-label="Abrir menu principal"
            onClick={onOpenMenu}
          >
            <Menu className="size-4" />
          </Button>

          <ActiveTenantSelector
            tenantId={tenantId}
            tenantName={tenantName}
            tenants={eligibleTenants}
            baseTenantId={baseTenantId}
            baseTenantName={baseTenantName}
            blockedTenants={blockedTenants}
            networkName={networkName}
            availableScopes={availableScopes}
            broadAccess={broadAccess}
            ready={shellReady}
            disabled={savingTenant || tenantLoading}
            onChange={handleChangeTenant}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            const event = new KeyboardEvent("keydown", {
              key: "k",
              metaKey: true,
              bubbles: true,
            });
            document.dispatchEvent(event);
          }}
          className="group relative flex h-9 w-full max-w-[240px] items-center gap-2 rounded-md border border-input bg-secondary/50 px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:max-w-[320px]"
        >
          <Search className="size-4 shrink-0 transition-colors group-hover:text-gym-accent" />
          <span className="flex-1 text-left">Buscar ou navegar...</span>
          <div className="pointer-events-none hidden items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </div>
        </button>
      </div>
    </div>
  );
}
export const AppTopbar = memo(AppTopbarComponent);
