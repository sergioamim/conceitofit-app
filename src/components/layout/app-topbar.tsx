"use client";

import { memo, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActiveTenantSelector } from "@/components/layout/active-tenant-selector";
import { OnboardingStatusBadge } from "@/components/layout/onboarding-status-badge";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";

type AppTopbarProps = {
  onOpenMenu?: () => void;
  shellReady?: boolean;
};

function AppTopbarComponent({ onOpenMenu, shellReady = false }: AppTopbarProps) {
  const router = useRouter();
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
      router.push("/dashboard");
    } finally {
      setSavingTenant(false);
    }
  }

  return (
    <div className="border-b border-border/40 px-4 py-4 md:px-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 md:hidden rounded-xl"
            aria-label="Abrir menu principal"
            onClick={onOpenMenu}
          >
            <Menu className="size-5" />
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

        <div className="flex items-center gap-2">
          <OnboardingStatusBadge />
        </div>
      </div>
    </div>
  );
}
export const AppTopbar = memo(AppTopbarComponent);
