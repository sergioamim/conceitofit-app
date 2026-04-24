"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Building2, ChevronRight, Command, Eye, Globe, Menu, Plus, Users } from "lucide-react";

const CommandPalette = dynamic(() => import("./command-palette"), {
  ssr: false,
  loading: () => null,
});

const DevSessionPanel =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("@/debug/dev-session-panel").then((m) => m.DevSessionPanel), {
        ssr: false,
        loading: () => null,
      })
    : () => null;
import { TenantContextProvider, useAuthAccess } from "@/lib/tenant/hooks/use-session-context";
import { BackofficeContextProvider, useBackofficeContext } from "@/backoffice/lib/backoffice-context";
import {
  AUTH_SESSION_UPDATED_EVENT,
  clearBackofficeRecoverySession,
  clearAuthSession,
  getBackofficeRecoverySession,
  getNetworkSlugFromSession,
  getRefreshToken,
  getRolesFromSession,
  hasGlobalBackofficeAccessFromSession,
  hasBackofficeReturnSession,
  hasRestorableBackofficeReturnSession,
  hasActiveSession,
  markBackofficeReauthRequired,
  restoreBackofficeReturnSession,
} from "@/lib/api/session";
import { logoutApi, refreshTokenApi } from "@/lib/api/auth";
import { buildAdminLoginHref, buildLoginHref } from "@/lib/tenant/auth-redirect";
import {
  adminGroups as backofficeNavGroups,
  allAdminNavItems as allBackofficeNavItems,
  type NavItem as BackofficeNavItem,
} from "@/backoffice/lib/nav-items";
import { hasElevatedAccess } from "@/lib/access-control";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { SidebarBackoffice } from "@/backoffice/components/sidebar-backoffice";
import { SandboxBanner } from "@/components/layout/sandbox-banner";
import { NotificationBellPortal } from "@/components/portal/notifications/notification-bell-portal";

function isBackofficeNavItemActive(pathname: string, item: BackofficeNavItem) {
  return pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + "/"));
}

// ---------------------------------------------------------------------------
// Breadcrumbs
// ---------------------------------------------------------------------------

function useBreadcrumbs(pathname: string | null) {
  return useMemo(() => {
    if (!pathname) return [];
    const navItem = allBackofficeNavItems.find(
      (item) => isBackofficeNavItemActive(pathname, item),
    );
    const crumbs: { label: string; href?: string }[] = [
      { label: "Backoffice", href: "/admin" },
    ];
    if (navItem && navItem.href !== "/admin") {
      const group = backofficeNavGroups.find((g) =>
        g.items.some((i) => i.href === navItem.href),
      );
      if (group) {
        crumbs.push({ label: group.label });
      }
      crumbs.push({ label: navItem.label, href: navItem.href });
    }
    return crumbs;
  }, [pathname]);
}

function Breadcrumbs({ pathname }: { pathname: string | null }) {
  const crumbs = useBreadcrumbs(pathname);

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
      {crumbs.map((crumb, i) => (
        <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3" />}
          {crumb.href && i < crumbs.length - 1 ? (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className={i === crumbs.length - 1 ? "text-foreground font-medium" : ""}>
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Mode Badge
// ---------------------------------------------------------------------------

function ModeBadge() {
  const { mode, inspectedTenant } = useBackofficeContext();

  if (mode === "tenant" && inspectedTenant) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-gym-warning/30 bg-gym-warning/10 px-3 py-1 text-[10px] font-bold text-gym-warning uppercase tracking-tighter">
        <Eye className="size-3" />
        Inspecionando: {inspectedTenant.tenantName}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-gym-accent/30 bg-gym-accent/10 px-3 py-1 text-[10px] font-bold text-gym-accent uppercase tracking-tighter">
      <Globe className="size-3" />
      Plataforma
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shell Frame
// ---------------------------------------------------------------------------

function AdminShellFrame({ children, pathname }: { children: ReactNode; pathname?: string }) {
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdkOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="relative h-screen bg-background overflow-hidden flex flex-col">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[800px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gym-accent/5 opacity-50 blur-[120px]" />

        <SandboxBanner />

        <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} />

        <div className="flex flex-1 overflow-hidden">
          <SidebarBackoffice
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
            onOpenCmdk={() => setCmdkOpen(true)}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-4 px-4 py-4 md:px-10 md:py-10 overflow-y-auto bg-v2-gradient">
            <header className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="flex size-10 items-center justify-center rounded-xl border border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
                  aria-label="Abrir menu"
                >
                  <Menu className="size-5" />
                </button>
                <Breadcrumbs pathname={pathname ?? null} />
              </div>
              <div className="flex items-center gap-3">
                <NotificationBellPortal />
                <ModeBadge />
              </div>
            </header>

            <main className="flex-1">{children}</main>
          </div>
        </div>
      </div>
      <DevSessionPanel />
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Status / Auth
// ---------------------------------------------------------------------------

function AdminStatusPanel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl border bg-card p-6 text-sm", className)}>{children}</div>;
}

function AdminLayoutFallback({ children }: { children: ReactNode }) {
  return (
    <AdminShellFrame>
      <div className="space-y-6">
        <AdminStatusPanel className="border-border text-muted-foreground">Carregando backoffice...</AdminStatusPanel>
        {children}
      </div>
    </AdminShellFrame>
  );
}

function AdminLayoutContent({
  children,
  initialAuthenticated,
}: {
  children: ReactNode;
  initialAuthenticated?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const access = useAuthAccess();
  const [hydrated, setHydrated] = useState(false);
  const [authenticated, setAuthenticated] = useState(initialAuthenticated ?? false);
  const [recoveringElevatedAccess, setRecoveringElevatedAccess] = useState(false);
  const sessionRoles = getRolesFromSession();
  const hasSessionBackofficeAccess = hasGlobalBackofficeAccessFromSession();
  const resolvedRoles = access.roles.length > 0 ? access.roles : sessionRoles;
  const accessLoading = access.loading && resolvedRoles.length === 0;
  const canAccessElevated = access.canAccessElevatedModules || hasElevatedAccess(resolvedRoles) || hasSessionBackofficeAccess;

  useEffect(() => {
    const syncAuthenticated = () => {
      setAuthenticated(hasActiveSession());
      setHydrated(true);
    };
    syncAuthenticated();
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, syncAuthenticated);
    window.addEventListener("storage", syncAuthenticated);
    return () => {
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, syncAuthenticated);
      window.removeEventListener("storage", syncAuthenticated);
    };
  }, []);

  useEffect(() => {
    if (hydrated && !authenticated) router.replace("/login");
  }, [authenticated, hydrated, router]);

  useEffect(() => {
    if (!hydrated || !authenticated || accessLoading || canAccessElevated) return;
    if (!hasBackofficeReturnSession()) return;
    if (!hasRestorableBackofficeReturnSession()) {
      markBackofficeReauthRequired();
      clearAuthSession();
      router.replace(buildAdminLoginHref("/admin", "backoffice-reauth"));
      return;
    }
    const restored = restoreBackofficeReturnSession();
    if (restored) window.location.assign("/admin");
  }, [accessLoading, authenticated, canAccessElevated, hydrated, router]);

  if (!hydrated || accessLoading || recoveringElevatedAccess) {
    return (
      <AdminShellFrame pathname={pathname}>
        <AdminStatusPanel className="border-border text-muted-foreground">
          {recoveringElevatedAccess ? "Restaurando sessão..." : "Validando permissões..."}
        </AdminStatusPanel>
      </AdminShellFrame>
    );
  }

  if (!canAccessElevated) {
    return (
      <AdminShellFrame pathname={pathname}>
        <AdminStatusPanel className="border-gym-danger/30 bg-gym-danger/10 text-gym-danger">
          O backoffice global exige perfil administrativo elevado.
        </AdminStatusPanel>
      </AdminShellFrame>
    );
  }

  return <AdminShellFrame pathname={pathname}>{children}</AdminShellFrame>;
}

export function AdminLayoutClient({
  children,
  initialAuthenticated,
}: {
  children: ReactNode;
  initialAuthenticated?: boolean;
}) {
  return (
    <BackofficeContextProvider>
      <TenantContextProvider>
        <Suspense fallback={<AdminLayoutFallback>{children}</AdminLayoutFallback>}>
          <AdminLayoutContent initialAuthenticated={initialAuthenticated}>{children}</AdminLayoutContent>
        </Suspense>
      </TenantContextProvider>
    </BackofficeContextProvider>
  );
}
