"use client";

import { memo, useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Search, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActiveTenantSelector } from "@/components/layout/active-tenant-selector";
import { OnboardingStatusBadge } from "@/components/layout/onboarding-status-badge";
import { NotificationBellPortal } from "@/components/portal/notifications/notification-bell-portal";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { cn } from "@/lib/utils";

type AppTopbarProps = {
  onOpenMenu?: () => void;
  shellReady?: boolean;
};

function AppTopbarComponent({ onOpenMenu, shellReady = false }: AppTopbarProps) {
  const [savingTenant, setSavingTenant] = useState(false);
  // Shortcut hint (⌘K / Ctrl+K) só depois de mount pra evitar hydration
  // mismatch — navigator.platform varia entre SSR e client.
  const [cmdText, setCmdText] = useState("");
  useEffect(() => {
    const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
    setCmdText(isMac ? "⌘K" : "Ctrl+K");
  }, []);

  function openCommandPalette() {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  }

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
      // Troca de unidade redefine todo o contexto operacional.
      // Forçamos reload completo do dashboard para evitar UI stale em caches
      // client-side/RSC entre tenants diferentes.
      window.location.replace("/dashboard");
    } finally {
      setSavingTenant(false);
    }
  }

  return (
    <div className="border-b border-border/40 px-4 py-2 md:px-8">
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
          <button
            type="button"
            onClick={openCommandPalette}
            aria-label="Busca global"
            className={cn(
              "flex h-10 items-center gap-2 rounded-xl border border-border/40 bg-muted/40 px-3",
              "text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
              "w-[220px] md:w-[280px]",
            )}
          >
            <Search size={16} className="shrink-0" />
            <span className="flex-1 text-left">Buscar...</span>
            {cmdText && (
              <kbd className="hidden rounded border border-border/40 bg-background/50 px-1.5 py-0.5 font-mono text-[10px] opacity-60 md:inline-block">
                {cmdText}
              </kbd>
            )}
          </button>

          <Button
            asChild
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-xl"
            title="Nova venda"
            aria-label="Nova venda"
          >
            <Link href="/vendas/nova">
              <ShoppingCart className="size-5" />
            </Link>
          </Button>

          <NotificationBellPortal />

          <OnboardingStatusBadge />
        </div>
      </div>
    </div>
  );
}
export const AppTopbar = memo(AppTopbarComponent);
