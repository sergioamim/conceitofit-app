"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { AppContentShell } from "@/components/layout/app-content-shell";
import { CommandPalette } from "@/components/layout/command-palette";
import { TenantThemeSync } from "@/components/layout/tenant-theme-sync";
import { ImpersonationBanner } from "@/components/backoffice/impersonation-banner";
import { Button } from "@/components/ui/button";
import { DevSessionPanel } from "@/debug/dev-session-panel";
import { TenantContextProvider, useTenantContext } from "@/hooks/use-session-context";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { AUTH_SESSION_UPDATED_EVENT, getAccessToken, getNetworkSlugFromSession } from "@/lib/api/session";
import { buildLoginHref } from "@/lib/tenant/auth-redirect";
import { isClientOperationalEligibilityEnabled } from "@/lib/feature-flags";

function isClientScopedUser(userKind?: string): boolean {
  const normalized = userKind?.trim().toUpperCase() ?? "";
  return normalized === "CLIENTE" || normalized === "ALUNO";
}

function AppOperationalAccessGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    loading,
    tenantId,
    userKind,
    eligibleTenants,
    blockedTenants,
    operationalAccessBlocked,
    operationalAccessMessage,
    refresh,
    setTenant,
  } = useTenantContext();
  const eligibilityEnabled = isClientOperationalEligibilityEnabled();

  useEffect(() => {
    if (!eligibilityEnabled || !isClientScopedUser(userKind) || loading) {
      return;
    }
    if (eligibleTenants.length !== 1) {
      return;
    }
    if (tenantId === eligibleTenants[0]?.id) {
      return;
    }
    void setTenant(eligibleTenants[0].id);
  }, [eligibilityEnabled, eligibleTenants, loading, setTenant, tenantId, userKind]);

  if (!eligibilityEnabled) {
    return <>{children}</>;
  }

  if (!isClientScopedUser(userKind) || loading) {
    return <>{children}</>;
  }

  if (!operationalAccessBlocked && eligibleTenants.length > 0) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Acesso autenticado na rede
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
          Nenhuma unidade elegível para operação
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {operationalAccessMessage
            ?? "Seu vínculo foi autenticado, mas o contrato atual não libera uso operacional em nenhuma unidade da rede."}
        </p>
        {blockedTenants.length > 0 ? (
          <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              Motivos informados pela rede
            </p>
            <ul className="mt-2 space-y-2 text-sm text-amber-100">
              {blockedTenants.map((tenant) => (
                <li key={tenant.tenantId}>
                  <span className="font-medium">{tenant.tenantName ?? tenant.tenantId}</span>
                  {tenant.blockedReasons[0]?.message ? `: ${tenant.blockedReasons[0].message}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" onClick={() => void refresh()}>
            Tentar novamente
          </Button>
          <Button type="button" variant="outline" onClick={() => window.location.assign("/conta/perfil")}>
            Ver identidade e unidade-base
          </Button>
        </div>
      </div>
    </div>
  );
}

import { BottomNav } from "@/components/layout/bottom-nav";

function AppShellFrame({
  children,
  mobileMenuOpen = false,
  shellReady = false,
  onOpenMenu,
  onCloseMenu,
}: {
  children: React.ReactNode;
  mobileMenuOpen?: boolean;
  shellReady?: boolean;
  onOpenMenu?: () => void;
  onCloseMenu?: () => void;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <a href="#main-content" className="focus-ring-brand sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-gym-accent focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#0e0f11]">
        Saltar para o conteúdo
      </a>
      <TenantThemeSync />
      {mobileMenuOpen ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onCloseMenu}
        />
      ) : null}
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={onCloseMenu} shellReady={shellReady} />
      <main className="flex flex-1 flex-col overflow-hidden relative">
        <ImpersonationBanner />
        <AppTopbar onOpenMenu={onOpenMenu} shellReady={shellReady} />
        <AppContentShell>{children}</AppContentShell>
      </main>
      <CommandPalette />
      <DevSessionPanel />
      <BottomNav />
    </div>
  );
}

function AppLayoutFallback({ children }: { children: React.ReactNode }) {
  return <AppShellFrame>{children}</AppShellFrame>;
}

function AppLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shellReady, setShellReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const { addRecent } = useUserPreferences();
  const handleOpenMenu = useCallback(() => setMobileMenuOpen(true), []);
  const handleCloseMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    // Only add operational routes, skip home/login
    if (pathname && pathname !== "/" && pathname !== "/dashboard") {
      addRecent(pathname);
    }
  }, [pathname, addRecent]);

  useEffect(() => {
    function syncAuthenticated() {
      setAuthenticated(Boolean(getAccessToken()));
      setHydrated(true);
    }

    syncAuthenticated();
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, syncAuthenticated);
    window.addEventListener("storage", syncAuthenticated);

    return () => {
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, syncAuthenticated);
      window.removeEventListener("storage", syncAuthenticated);
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setShellReady(true);
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!hydrated || authenticated) {
      return;
    }
    if (!authenticated) {
      const queryString = searchParams.toString();
      const currentPath = `${pathname}${queryString ? `?${queryString}` : ""}`;
      router.replace(buildLoginHref(currentPath, getNetworkSlugFromSession()));
    }
  }, [authenticated, hydrated, pathname, router, searchParams]);

  return (
    <AppShellFrame
      mobileMenuOpen={mobileMenuOpen}
      shellReady={shellReady}
      onOpenMenu={handleOpenMenu}
      onCloseMenu={handleCloseMenu}
    >
      <AppOperationalAccessGate>{children}</AppOperationalAccessGate>
    </AppShellFrame>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TenantContextProvider>
      <Suspense fallback={<AppLayoutFallback>{children}</AppLayoutFallback>}>
        <AppLayoutContent>{children}</AppLayoutContent>
      </Suspense>
    </TenantContextProvider>
  );
}
