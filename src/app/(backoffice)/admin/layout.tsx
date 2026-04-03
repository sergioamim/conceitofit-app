"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Building2, ChevronRight, Clock, Command, Eye, Globe, LogOut, Plus, Rocket, Users, Wallet } from "lucide-react";
import { Command as CmdkRoot, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "cmdk";
import { DevSessionPanel } from "@/debug/dev-session-panel";
import { useAuthAccess } from "@/lib/tenant/hooks/use-session-context";
import { BackofficeContextProvider, useBackofficeContext } from "@/lib/backoffice/backoffice-context";
import {
  AUTH_SESSION_UPDATED_EVENT,
  clearAuthSession,
  getNetworkSlugFromSession,
  hasActiveSession,
} from "@/lib/api/session";
import { logoutApi } from "@/lib/api/auth";
import { buildLoginHref } from "@/lib/tenant/auth-redirect";
import { backofficeNavGroups, allBackofficeNavItems, sidebarBackofficeNavGroups } from "@/lib/backoffice/nav-items";
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
// Command Palette
// ---------------------------------------------------------------------------

const ITEM_CLASS =
  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground aria-selected:bg-gym-accent/10 aria-selected:text-foreground";
const GROUP_HEADING_CLASS =
  "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground/60";

function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [recentRoutes, setRecentRoutes] = useState<RecentRoute[]>([]);

  // Carregar acessos recentes somente apos mount (SSR-safe)
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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onClose]);

  // Resolver icone para acessos recentes a partir dos nav items
  const recentWithIcons = useMemo(() => {
    return recentRoutes
      .map((r) => {
        const navItem = allBackofficeNavItems.find((n) => n.href === r.href);
        return navItem ? { ...r, icon: navItem.icon } : null;
      })
      .filter((r): r is RecentRoute & { icon: typeof Plus } => r !== null);
  }, [recentRoutes]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        <CmdkRoot label="Command palette" className="flex flex-col">
          <CommandInput
            placeholder="Buscar paginas, acoes, configuracoes..."
            className="border-b border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <CommandList className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin">
            <CommandEmpty className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhuma pagina encontrada.
            </CommandEmpty>

            {/* Acoes Rapidas */}
            <CommandGroup heading="Acoes Rapidas" className={GROUP_HEADING_CLASS}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    value={`acao ${action.label} ${action.searchTags.join(" ")}`}
                    onSelect={() => handleNavigate(action.href, action.label)}
                    className={ITEM_CLASS}
                  >
                    <div className="flex size-5 items-center justify-center rounded bg-gym-accent/15">
                      <Icon className="size-3 text-gym-accent" />
                    </div>
                    {action.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {/* Acessos Recentes */}
            {recentWithIcons.length > 0 && (
              <CommandGroup heading="Acessos Recentes" className={GROUP_HEADING_CLASS}>
                {recentWithIcons.map((recent) => {
                  const Icon = recent.icon;
                  return (
                    <CommandItem
                      key={`recent-${recent.href}`}
                      value={`recente ${recent.label}`}
                      onSelect={() => handleNavigate(recent.href, recent.label)}
                      className={ITEM_CLASS}
                    >
                      <Clock className="size-4 shrink-0 text-muted-foreground/50" />
                      <Icon className="size-4 shrink-0" />
                      {recent.label}
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
          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="rounded border border-border bg-card px-1 py-0.5">
                  ↑↓
                </span>{" "}
                Navegar
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="rounded border border-border bg-card px-1 py-0.5">
                  ↵
                </span>{" "}
                Selecionar
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="rounded border border-border bg-card px-1 py-0.5">
                  esc
                </span>{" "}
                Fechar
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground">
              Backoffice <span className="text-gym-accent">⌘K</span>
            </div>
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
    <div className="min-h-screen bg-background">
      <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} />

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border/80 bg-card/80 p-4 shadow-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gym-accent">
              Conceito Fit
            </p>
            <p className="text-sm font-bold">Backoffice</p>
          </div>

          <button
            onClick={() => setCmdkOpen(true)}
            className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Command className="size-3" />
            <span className="flex-1 text-left">Buscar...</span>
            <kbd className="rounded border border-border bg-background px-1 py-0.5 text-[10px] font-mono">
              ⌘K
            </kbd>
          </button>

          <nav aria-label="Menu backoffice" className="flex flex-col gap-3 text-sm">
            {sidebarBackofficeNavGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                  {group.title}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      pathname != null &&
                      (pathname === item.href ||
                        pathname.startsWith(item.href + "/"));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-2 transition-colors",
                          active
                            ? "border border-gym-accent/30 bg-gym-accent/10 text-foreground"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-auto space-y-1 border-t border-border/50 pt-3">
            <Link
              href="/admin/entrar-como-academia"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-gym-teal/10 hover:text-gym-teal"
            >
              <Building2 className="size-4 shrink-0" />
              Entrar como academia
            </Link>
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-gym-danger/10 hover:text-gym-danger"
            >
              <LogOut className="size-4 shrink-0" />
              Sair
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 px-6 py-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <Breadcrumbs pathname={pathname ?? null} />
            <ModeBadge />
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle>Encerrar sessao?</DialogTitle>
            <DialogDescription>
              Voce sera redirecionado para o login. Esta acao nao pode ser desfeita.
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
              Nao, permanecer
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

  if (!hydrated || access.loading) {
    return (
      <AdminShellFrame pathname={pathname}>
        <AdminStatusPanel className="border-border text-muted-foreground">
          Validando permissoes do backoffice...
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

  if (!access.canAccessElevatedModules) {
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
