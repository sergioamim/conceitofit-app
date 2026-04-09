"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClienteBottomNav } from "@/components/layout/cliente-bottom-nav";
import { NotificationBell } from "@/components/cliente/notification-bell";
import { InadimplenciaBanner } from "@/components/cliente/inadimplencia-banner";
import { useClienteOperationalContext } from "@/lib/query/use-portal-aluno";
import { TenantThemeSync } from "@/components/layout/tenant-theme-sync";
import { TenantContextProvider, useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { logoutApi } from "@/lib/api/auth";
import {
  AUTH_SESSION_UPDATED_EVENT,
  getNetworkSlugFromSession,
  hasActiveSession,
  clearAuthSession,
} from "@/lib/api/session";
import { buildLoginHref } from "@/lib/tenant/auth-redirect";
import {
  registerPushToken,
  unregisterPushToken,
} from "@/lib/cliente/push-registration";

function ClienteTopbar() {
  const { displayName, networkName, tenantId, userId } = useTenantContext();
  const { data: opCtx } = useClienteOperationalContext({ id: userId, tenantId, enabled: !!userId });
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const redirectHref = buildLoginHref(undefined, getNetworkSlugFromSession());
      try {
        await logoutApi();
      } catch {
        // Mesmo sem resposta do backend, limpamos o estado local.
      }
      clearAuthSession();
      window.location.assign(redirectHref);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-border/40 bg-card/50 backdrop-blur-md px-4 py-3 sticky top-0 z-40">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">
          {displayName ?? "Cliente"}
        </p>
        {networkName ? (
          <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{networkName}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <NotificationBell tenantId={tenantId} alunoId={opCtx?.aluno?.id} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-gym-danger transition-colors"
          aria-label="Sair"
          onClick={() => setLogoutOpen(true)}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="border-border/40 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">Encerrar sessão?</DialogTitle>
            <DialogDescription>
              Você será redirecionado para o login. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="border-border/60 rounded-xl flex-1"
              onClick={() => setLogoutOpen(false)}
              disabled={loggingOut}
            >
              Não, permanecer
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl flex-1 font-bold shadow-lg shadow-gym-danger/20"
              disabled={loggingOut}
              onClick={() => void handleLogout()}
            >
              {loggingOut ? "Saindo..." : "Sim, sair"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

function ClienteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-v2-gradient">
      <a
        href="#main-content"
        className="focus-ring-brand sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-gym-accent focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#0e0f11]"
      >
        Saltar para o conteúdo
      </a>
      <TenantThemeSync />
      <ClienteTopbar />
      <InadimplenciaBanner />
      <main
        id="main-content"
        className="flex-1 overflow-y-auto px-4 pb-20 pt-4"
      >
        <div className="mx-auto w-full max-w-lg">{children}</div>
      </main>
      <ClienteBottomNav />
    </div>
  );
}

function ClienteLayoutContent({
  children,
  initialAuthenticated,
}: {
  children: React.ReactNode;
  initialAuthenticated?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hydrated, setHydrated] = useState(initialAuthenticated ?? false);
  const [authenticated, setAuthenticated] = useState(initialAuthenticated ?? false);

  useEffect(() => {
    function syncAuthenticated() {
      setAuthenticated(hasActiveSession());
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
    if (!hydrated || authenticated) return;
    const queryString = searchParams.toString();
    const currentPath = `${pathname}${queryString ? `?${queryString}` : ""}`;
    router.replace(buildLoginHref(currentPath, getNetworkSlugFromSession()));
  }, [authenticated, hydrated, pathname, router, searchParams]);

  // Push notification registration (silencioso)
  const { tenantId } = useTenantContext();

  useEffect(() => {
    if (!authenticated || !tenantId) return;

    void registerPushToken(tenantId);

    return () => {
      void unregisterPushToken(tenantId);
    };
  }, [authenticated, tenantId]);

  return <ClienteShell>{children}</ClienteShell>;
}

function ClienteLayoutFallback({ children }: { children: React.ReactNode }) {
  return <ClienteShell>{children}</ClienteShell>;
}

export function ClienteLayoutClient({
  children,
  initialAuthenticated,
}: {
  children: React.ReactNode;
  initialAuthenticated?: boolean;
}) {
  return (
    <TenantContextProvider>
      <Suspense fallback={<ClienteLayoutFallback>{children}</ClienteLayoutFallback>}>
        <ClienteLayoutContent initialAuthenticated={initialAuthenticated}>{children}</ClienteLayoutContent>
      </Suspense>
    </TenantContextProvider>
  );
}
