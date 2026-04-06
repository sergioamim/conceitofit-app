"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Building2, ChevronRight, Clock, Command, Eye, Globe, Menu, Plus, Rocket, Users, Wallet } from "lucide-react";
import { Command as CmdkRoot, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "cmdk";
import { DevSessionPanel } from "@/debug/dev-session-panel";
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
import { adminGroupsV2 as backofficeNavGroups, allAdminNavItemsV2 as allBackofficeNavItems } from "@/backoffice/lib/nav-items-v2";
import type { NavItemV2 as BackofficeNavItem } from "@/backoffice/lib/nav-items-v2";
import { hasElevatedAccess } from "@/lib/access-control";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { SidebarBackoffice } from "@/backoffice/components/sidebar-backoffice";

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
// Command Palette — Acessos recentes
// ---------------------------------------------------------------------------

const RECENT_ROUTES_KEY = "backoffice-recent-routes";
const MAX_RECENT_ROUTES = 5;

type RecentRoute = { href: string; label: string; timestamp: number };

function readRecentRoutes(): RecentRoute[] {
  try {
    const raw = localStorage.getItem(RECENT_ROUTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as any;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecentRoute(href: string, label: string) {
  try {
    const existing = readRecentRoutes().filter((r) => r.href !== href);
    const updated = [
      { href, label, timestamp: Date.now() },
      ...existing,
    ].slice(0, MAX_RECENT_ROUTES);
    localStorage.setItem(RECENT_ROUTES_KEY, JSON.stringify(updated));
  } catch {}
}

const quickActions = [
  { id: "qa-provisionar", label: "Provisionar Academia", href: "/admin/onboarding/provisionar", icon: Rocket },
  { id: "qa-novo-lead", label: "Novo Lead B2B", href: "/admin/leads", icon: Users },
  { id: "qa-gerar-cobranca", label: "Gerar Cobrança", href: "/admin/financeiro/cobrancas", icon: Wallet },
  { id: "qa-entrar-academia", label: "Acessar Unidade", href: "/admin/entrar-como-academia", icon: Building2 },
];

const ITEM_CLASS = "flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground aria-selected:bg-gym-accent/10 aria-selected:text-foreground";
const GROUP_HEADING_CLASS = "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground/60";

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [recentRoutes, setRecentRoutes] = useState<RecentRoute[]>([]);

  useEffect(() => {
    if (open) setRecentRoutes(readRecentRoutes());
  }, [open]);

  const handleNavigate = useCallback((href: string, label: string) => {
    saveRecentRoute(href, label);
    onClose();
    router.push(href);
  }, [onClose, router]);

  const recentWithIcons = useMemo(() => {
    return recentRoutes.map((r) => {
      const navItem = allBackofficeNavItems.find((n) => n.href === r.href);
      return { ...r, icon: navItem?.icon || Clock };
    });
  }, [recentRoutes]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CmdkRoot label="Command palette" className="flex flex-col">
          <CommandInput
            placeholder="Navegar para..."
            className="border-b border-border/40 bg-transparent px-4 py-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <CommandList className="max-h-72 overflow-y-auto p-2 scrollbar-none">
            <CommandEmpty className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhuma página encontrada.</CommandEmpty>

            <CommandGroup heading="Ações Rápidas" className={GROUP_HEADING_CLASS}>
              {quickActions.map((action) => (
                <CommandItem key={action.id} onSelect={() => handleNavigate(action.href, action.label)} className={ITEM_CLASS}>
                  <action.icon className="size-4 shrink-0" />
                  {action.label}
                </CommandItem>
              ))}
            </CommandGroup>

            {recentWithIcons.length > 0 && (
              <CommandGroup heading="Recentes" className={GROUP_HEADING_CLASS}>
                {recentWithIcons.map((route) => (
                  <CommandItem key={route.href} onSelect={() => handleNavigate(route.href, route.label)} className={ITEM_CLASS}>
                    <route.icon className="size-4 shrink-0" />
                    {route.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {backofficeNavGroups.map((group) => (
              <CommandGroup key={group.label} heading={group.label} className={GROUP_HEADING_CLASS}>
                {group.items.map((item) => (
                  <CommandItem key={item.href} onSelect={() => handleNavigate(item.href, item.label)} className={ITEM_CLASS}>
                    <item.icon className="size-4 shrink-0" />
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </CmdkRoot>
      </div>
    </div>
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
              <ModeBadge />
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

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const access = useAuthAccess();
  const [hydrated, setHydrated] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
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

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <BackofficeContextProvider>
      <TenantContextProvider>
        <Suspense fallback={<AdminLayoutFallback>{children}</AdminLayoutFallback>}>
          <AdminLayoutContent>{children}</AdminLayoutContent>
        </Suspense>
      </TenantContextProvider>
    </BackofficeContextProvider>
  );
}
