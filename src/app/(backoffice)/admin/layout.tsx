"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Command, Eye, Globe } from "lucide-react";
import { Command as CmdkRoot, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "cmdk";
import { DevSessionPanel } from "@/debug/dev-session-panel";
import { TenantContextProvider } from "@/lib/tenant/hooks/use-session-context";
import { useAuthAccess } from "@/lib/tenant/hooks/use-session-context";
import { BackofficeContextProvider, useBackofficeContext } from "@/lib/backoffice/backoffice-context";
import { AUTH_SESSION_UPDATED_EVENT, getAccessToken, getNetworkSlugFromSession } from "@/lib/api/session";
import { buildLoginHref } from "@/lib/tenant/auth-redirect";
import { backofficeNavGroups, allBackofficeNavItems } from "@/lib/backoffice/nav-items";
import type { BackofficeNavItem } from "@/lib/backoffice/nav-items";
import { cn } from "@/lib/utils";

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

  const handleSelect = useCallback(
    (item: BackofficeNavItem) => {
      onClose();
      router.push(item.href);
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
            {backofficeNavGroups.map((group) => (
              <CommandGroup
                key={group.title}
                heading={group.title}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground/60"
              >
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.href}
                      value={`${group.title} ${item.label}`}
                      onSelect={() => handleSelect(item)}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground aria-selected:bg-gym-accent/10 aria-selected:text-foreground"
                    >
                      <Icon className="size-4 shrink-0" />
                      {item.label}
                    </CommandItem>
                  );
                })}
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

  return (
    <div className="min-h-screen bg-background">
      <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} />

      <div className="mx-auto flex max-w-6xl gap-6 px-6 py-6">
        {/* Sidebar */}
        <aside className="sticky top-6 flex h-fit w-56 shrink-0 flex-col gap-4 rounded-lg border border-border/80 bg-card/80 p-3 shadow-sm">
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

          <nav className="flex flex-col gap-3 text-sm">
            {backofficeNavGroups.map((group) => (
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
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Header */}
          <header className="flex items-center justify-between">
            <Breadcrumbs pathname={pathname ?? null} />
            <ModeBadge />
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>
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
    if (!hydrated || authenticated) return;
    const queryString = searchParams.toString();
    const currentPath = `${pathname}${queryString ? `?${queryString}` : ""}`;
    router.replace(buildLoginHref(currentPath, getNetworkSlugFromSession()));
  }, [authenticated, hydrated, pathname, router, searchParams]);

  if (!hydrated || access.loading) {
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
    <TenantContextProvider>
      <BackofficeContextProvider>
        <Suspense
          fallback={<AdminLayoutFallback>{children}</AdminLayoutFallback>}
        >
          <AdminLayoutContent>{children}</AdminLayoutContent>
        </Suspense>
      </BackofficeContextProvider>
    </TenantContextProvider>
  );
}
