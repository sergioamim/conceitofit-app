"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Building2, ChevronLeft, ChevronRight, Clock, Command, Eye, Globe, LogOut, Menu, Plus, Rocket, Users, Wallet } from "lucide-react";
import { Command as CmdkRoot, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "cmdk";
import { DevSessionPanel } from "@/debug/dev-session-panel";
import { useAuthAccess } from "@/lib/tenant/hooks/use-session-context";
import { BackofficeContextProvider, useBackofficeContext } from "@/backoffice/lib/backoffice-context";
import {
  AUTH_SESSION_UPDATED_EVENT,
  clearAuthSession,
  getNetworkSlugFromSession,
  getRolesFromSession,
  hasGlobalBackofficeAccessFromSession,
  hasBackofficeReturnSession,
  hasActiveSession,
  restoreBackofficeReturnSession,
} from "@/lib/api/session";
import { logoutApi } from "@/lib/api/auth";
import { buildLoginHref } from "@/lib/tenant/auth-redirect";
import { backofficeNavGroups, allBackofficeNavItems, sidebarBackofficeNavGroups } from "@/backoffice/lib/nav-items";
import type { BackofficeNavItem } from "@/backoffice/lib/nav-items";
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
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SIDEBAR_STORAGE_KEY = "backoffice-sidebar-collapsed";

// ---------------------------------------------------------------------------
// Breadcrumbs
// ---------------------------------------------------------------------------

function useBreadcrumbs(pathname: string | null) {
  return useMemo(() => {
    if (!pathname) return [];
    const navItem = allBackofficeNavItems.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
    );
    const crumbs: { label: string; href?: string }[] = [
      { label: "Backoffice", href: "/admin" },
    ];
    if (navItem && navItem.href !== "/admin") {
      const group = backofficeNavGroups.find((g) =>
        g.items.some((i) => i.href === navItem.href),
      );
      if (group) {
        crumbs.push({ label: group.title });
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
// Command Palette — Acessos recentes (localStorage SSR-safe)
// ---------------------------------------------------------------------------

const RECENT_ROUTES_KEY = "backoffice-recent-routes";
const MAX_RECENT_ROUTES = 5;

type RecentRoute = { href: string; label: string; timestamp: number };

function readRecentRoutes(): RecentRoute[] {
  try {
    const raw = localStorage.getItem(RECENT_ROUTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (r): r is RecentRoute =>
          typeof r === "object" &&
          r !== null &&
          typeof (r as RecentRoute).href === "string" &&
          typeof (r as RecentRoute).label === "string" &&
          typeof (r as RecentRoute).timestamp === "number",
      )
      .slice(0, MAX_RECENT_ROUTES);
  } catch {
    return [];
  }
}

function saveRecentRoute(href: string, label: string) {
  try {
    const existing = readRecentRoutes().filter((r) => r.href !== href);
    const updated: RecentRoute[] = [
      { href, label, timestamp: Date.now() },
      ...existing,
    ].slice(0, MAX_RECENT_ROUTES);
    localStorage.setItem(RECENT_ROUTES_KEY, JSON.stringify(updated));
  } catch {
    // localStorage pode estar indisponivel
  }
}

// ---------------------------------------------------------------------------
// Acoes rapidas do backoffice
// ---------------------------------------------------------------------------

type QuickAction = {
  id: string;
  label: string;
  href: string;
  icon: typeof Plus;
  searchTags: string[];
};

const quickActions: QuickAction[] = [
  {
    id: "qa-provisionar",
    label: "Provisionar Academia",
    href: "/admin/onboarding/provisionar",
    icon: Rocket,
    searchTags: ["criar academia", "nova academia", "setup", "ativar"],
  },
  {
    id: "qa-novo-lead",
    label: "Novo Lead B2B",
    href: "/admin/leads",
    icon: Users,
    searchTags: ["novo lead", "prospecto", "comercial", "adicionar lead"],
  },
  {
    id: "qa-gerar-cobranca",
    label: "Gerar Cobranca",
    href: "/admin/financeiro/cobrancas",
    icon: Wallet,
    searchTags: ["nova cobranca", "billing", "fatura", "invoice", "boleto"],
  },
  {
    id: "qa-entrar-academia",
    label: "Entrar como Academia",
    href: "/admin/entrar-como-academia",
    icon: Building2,
    searchTags: ["impersonar", "simular", "acessar como", "trocar"],
  },
];

// ---------------------------------------------------------------------------
// Command Palette — CSS constants
// ---------------------------------------------------------------------------

const ITEM_CLASS =
  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground aria-selected:bg-gym-accent/10 aria-selected:text-foreground";
const GROUP_HEADING_CLASS =
  "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground/60";

// ---------------------------------------------------------------------------
// Command Palette
// ---------------------------------------------------------------------------

function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [recentRoutes, setRecentRoutes] = useState<RecentRoute[]>([]);

  // Carrega rotas recentes quando a palette abre (SSR-safe)
  useEffect(() => {
    if (open) {
      setRecentRoutes(readRecentRoutes());
    }
  }, [open]);

  const handleNavigate = useCallback(
    (href: string, label: string) => {
      saveRecentRoute(href, label);
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  // Resolve icones para rotas recentes a partir do nav registry
  const recentWithIcons = useMemo(() => {
    return recentRoutes.map((r) => {
      const navItem = allBackofficeNavItems.find((n) => n.href === r.href);
      return { ...r, icon: navItem?.icon ?? Clock };
    });
  }, [recentRoutes]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        <CmdkRoot label="Command palette" className="flex flex-col">
          <CommandInput
            placeholder="Navegar para..."
            className="border-b border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <CommandList className="max-h-72 overflow-y-auto p-2">
            <CommandEmpty className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhuma página encontrada.
            </CommandEmpty>

            {/* Acoes rapidas */}
            <CommandGroup heading="Ações Rápidas" className={GROUP_HEADING_CLASS}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    value={[action.label, ...action.searchTags].join(" ")}
                    onSelect={() => handleNavigate(action.href, action.label)}
                    className={ITEM_CLASS}
                  >
                    <Icon className="size-4 shrink-0" />
                    {action.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {/* Rotas recentes */}
            {recentWithIcons.length > 0 && (
              <CommandGroup heading="Recentes" className={GROUP_HEADING_CLASS}>
                {recentWithIcons.map((route) => {
                  const Icon = route.icon;
                  return (
                    <CommandItem
                      key={route.href}
                      value={`recente ${route.label}`}
                      onSelect={() => handleNavigate(route.href, route.label)}
                      className={ITEM_CLASS}
                    >
                      <Icon className="size-4 shrink-0" />
                      {route.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {/* Navegacao por grupo */}
            {backofficeNavGroups.map((group) => (
              <CommandGroup
                key={group.title}
                heading={group.title}
                className={GROUP_HEADING_CLASS}
              >
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const searchValue = [
                    group.title,
                    item.label,
                    ...(item.searchTags ?? []),
                  ].join(" ");
                  return (
                    <CommandItem
                      key={item.href}
                      value={searchValue}
                      onSelect={() => handleNavigate(item.href, item.label)}
                      className={ITEM_CLASS}
                    >
                      <Icon className="size-4 shrink-0" />
                      {item.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>

          {/* Footer com dicas de teclado */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] text-muted-foreground/60">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">↑↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">↵</kbd>
                abrir
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">esc</kbd>
              fechar
            </span>
          </div>
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
      <div className="flex items-center gap-1.5 rounded-full border border-gym-warning/30 bg-gym-warning/10 px-2.5 py-1 text-[11px] font-semibold text-gym-warning">
        <Eye className="size-3" />
        Inspecionando: {inspectedTenant.tenantName ?? inspectedTenant.tenantId}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-gym-accent/30 bg-gym-accent/10 px-2.5 py-1 text-[11px] font-semibold text-gym-accent">
      <Globe className="size-3" />
      Plataforma
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar nav content (reused in desktop aside and mobile Sheet)
// ---------------------------------------------------------------------------

function SidebarNavContent({
  pathname,
  collapsed,
  onOpenCmdk,
  onOpenLogout,
  onNavigate,
}: {
  pathname?: string;
  collapsed: boolean;
  onOpenCmdk: () => void;
  onOpenLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      {/* Logo / brand */}
      <div className={cn("shrink-0", collapsed && "flex flex-col items-center")}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gym-accent">
          {collapsed ? "CF" : "Conceito Fit"}
        </p>
        {!collapsed && <p className="text-sm font-bold">Backoffice</p>}
      </div>

      {/* Command palette trigger */}
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onOpenCmdk}
              className="flex items-center justify-center rounded-md border border-border bg-secondary/50 p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Command className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>Buscar (⌘K)</TooltipContent>
        </Tooltip>
      ) : (
        <button
          onClick={onOpenCmdk}
          className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Command className="size-3" />
          <span className="flex-1 text-left">Buscar...</span>
          <kbd className="rounded border border-border bg-background px-1 py-0.5 text-[10px] font-mono">
            ⌘K
          </kbd>
        </button>
      )}

      {/* Navigation */}
      <nav aria-label="Menu backoffice" className="flex flex-col gap-3 text-sm overflow-y-auto flex-1 min-h-0">
        {sidebarBackofficeNavGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                {group.title}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname != null &&
                  (pathname === item.href ||
                    pathname.startsWith(item.href + "/"));

                const linkContent = (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 motion-safe:transition-colors motion-safe:duration-200",
                      collapsed && "justify-center px-2",
                      active
                        ? "border border-gym-accent/30 bg-gym-accent/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {!collapsed && item.label}
                  </Link>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return linkContent;
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="mt-auto shrink-0 space-y-1 border-t border-border/50 pt-3">
        {collapsed ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/admin/entrar-como-academia"
                  onClick={onNavigate}
                  className="flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-gym-teal/10 hover:text-gym-teal"
                >
                  <Building2 className="size-4 shrink-0" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>Entrar como academia</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onOpenLogout}
                  className="flex w-full items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-gym-danger/10 hover:text-gym-danger"
                >
                  <LogOut className="size-4 shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>Sair</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <Link
              href="/admin/entrar-como-academia"
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-gym-teal/10 hover:text-gym-teal"
            >
              <Building2 className="size-4 shrink-0" />
              Entrar como academia
            </Link>
            <button
              type="button"
              onClick={onOpenLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-gym-danger/10 hover:text-gym-danger"
            >
              <LogOut className="size-4 shrink-0" />
              Sair
            </button>
          </>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shell Frame
// ---------------------------------------------------------------------------

function AdminShellFrame({
  children,
  pathname,
}: {
  children: ReactNode;
  pathname?: string;
}) {
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Sidebar state: SSR default = expanded (false = not collapsed)
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Track whether user manually toggled (to avoid overriding with auto-collapse)
  const userToggledRef = useRef(false);

  // Hydrate sidebar preference from localStorage + detect breakpoint (SSR-safe)
  useEffect(() => {
    // Read persisted preference
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored === "true") {
        setCollapsed(true);
      }
    } catch {
      // localStorage unavailable — keep default
    }

    // Detect initial breakpoint
    const mql = window.matchMedia("(max-width: 767px)");
    const lgMql = window.matchMedia("(max-width: 1023px)");

    function handleMobileChange() {
      setIsMobile(mql.matches);
    }

    function handleLgChange() {
      // Auto-collapse on < lg, but only if user hasn't manually toggled
      if (!userToggledRef.current) {
        setCollapsed(lgMql.matches);
      }
    }

    handleMobileChange();
    handleLgChange();

    mql.addEventListener("change", handleMobileChange);
    lgMql.addEventListener("change", handleLgChange);

    return () => {
      mql.removeEventListener("change", handleMobileChange);
      lgMql.removeEventListener("change", handleLgChange);
    };
  }, []);

  // Persist collapse preference when user manually toggles
  function toggleCollapsed() {
    userToggledRef.current = true;
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // localStorage unavailable
      }
      return next;
    });
  }

  // Cmd+K handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdkOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const redirectHref = buildLoginHref(undefined, getNetworkSlugFromSession());
      try {
        await logoutApi();
      } catch {
        // Seguimos com a limpeza local mesmo se o backend falhar.
      }
      clearAuthSession();
      window.location.assign(redirectHref);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-background">
        <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} />

        <div className="flex min-h-screen">
          {/* Desktop sidebar */}
          <aside
            className={cn(
              "sticky top-0 hidden h-screen shrink-0 flex-col gap-4 overflow-hidden border-r border-border/80 bg-card/80 p-4 shadow-sm md:flex",
              "motion-safe:transition-all motion-safe:duration-200",
              collapsed ? "w-16" : "w-72",
            )}
          >
            <SidebarNavContent
              pathname={pathname}
              collapsed={collapsed}
              onOpenCmdk={() => setCmdkOpen(true)}
              onOpenLogout={() => setLogoutOpen(true)}
            />

            {/* Toggle button */}
            <button
              type="button"
              onClick={toggleCollapsed}
              className="absolute -right-3 top-6 z-10 flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm motion-safe:transition-colors hover:bg-muted hover:text-foreground"
              aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
            >
              <ChevronLeft className={cn("size-3 motion-safe:transition-transform motion-safe:duration-200", collapsed && "rotate-180")} />
            </button>
          </aside>

          {/* Mobile Sheet overlay */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent
              side="left"
              showCloseButton
              className="flex w-72 flex-col gap-4 border-border/80 bg-card/80 p-4 md:hidden"
            >
              <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
              <SidebarNavContent
                pathname={pathname}
                collapsed={false}
                onOpenCmdk={() => {
                  setMobileOpen(false);
                  setCmdkOpen(true);
                }}
                onOpenLogout={() => {
                  setMobileOpen(false);
                  setLogoutOpen(true);
                }}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          {/* Main content */}
          <div className="flex min-w-0 flex-1 flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
            {/* Header */}
            <header className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Mobile hamburger */}
                {isMobile && (
                  <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
                    aria-label="Abrir menu"
                  >
                    <Menu className="size-5" />
                  </button>
                )}
                <Breadcrumbs pathname={pathname ?? null} />
              </div>
              <ModeBadge />
            </header>

            <main className="flex-1">{children}</main>
          </div>
        </div>
        <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
          <DialogContent className="border-border bg-card">
            <DialogHeader>
              <DialogTitle>Encerrar sessão?</DialogTitle>
              <DialogDescription>
                Você será redirecionado para o login. Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="border-border"
                onClick={() => setLogoutOpen(false)}
                disabled={loggingOut}
              >
                Não, permanecer
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={loggingOut}
                onClick={() => void handleLogout()}
              >
                {loggingOut ? "Saindo..." : "Sim, sair"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <DevSessionPanel />
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Status / Auth
// ---------------------------------------------------------------------------

function AdminStatusPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border bg-card p-6 text-sm", className)}>
      {children}
    </div>
  );
}

function AdminLayoutFallback({ children }: { children: ReactNode }) {
  return (
    <AdminShellFrame>
      <div className="space-y-6">
        <AdminStatusPanel className="border-border text-muted-foreground">
          Carregando backoffice...
        </AdminStatusPanel>
        {children}
      </div>
    </AdminShellFrame>
  );
}

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const access = useAuthAccess();
  const [hydrated, setHydrated] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const sessionRoles = getRolesFromSession();
  const hasSessionBackofficeAccess = hasGlobalBackofficeAccessFromSession();
  const resolvedRoles = access.roles.length > 0 ? access.roles : sessionRoles;
  const accessLoading = access.loading && resolvedRoles.length === 0;
  const canAccessElevated =
    access.canAccessElevatedModules
    || hasElevatedAccess(resolvedRoles)
    || hasSessionBackofficeAccess;

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
    router.replace("/admin-login");
  }, [authenticated, hydrated, pathname, router, searchParams]);

  useEffect(() => {
    if (!hydrated || !authenticated || accessLoading || canAccessElevated) {
      return;
    }
    if (!hasBackofficeReturnSession()) {
      return;
    }
    const restored = restoreBackofficeReturnSession();
    if (!restored) {
      return;
    }
    window.location.assign("/admin");
  }, [accessLoading, authenticated, canAccessElevated, hydrated]);

  if (!hydrated || accessLoading) {
    return (
      <AdminShellFrame pathname={pathname}>
        <AdminStatusPanel className="border-border text-muted-foreground">
          Validando permissões do backoffice...
        </AdminStatusPanel>
      </AdminShellFrame>
    );
  }

  if (!authenticated) {
    return (
      <AdminShellFrame pathname={pathname}>
        <AdminStatusPanel className="border-border text-muted-foreground">
          Redirecionando para o login do backoffice...
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

// ---------------------------------------------------------------------------
// Layout export
// ---------------------------------------------------------------------------

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <BackofficeContextProvider>
      <Suspense
        fallback={<AdminLayoutFallback>{children}</AdminLayoutFallback>}
      >
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </Suspense>
    </BackofficeContextProvider>
  );
}
