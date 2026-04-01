"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  LineChart,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { clearAuthSession, getNetworkSlugFromSession } from "@/lib/api/session";
import { logoutApi } from "@/lib/api/auth";
import { buildLoginHref } from "@/lib/tenant/auth-redirect";
import { DEFAULT_TENANT_APP_NAME } from "@/lib/tenant/tenant-theme";
import { MOTION_CLASSNAMES } from "@/lib/ui-motion";
import { cn } from "@/lib/utils";
import {
  mainNavItems as navItems,
  atividadeItems,
  treinoItems,
  crmItems,
  segurancaItems,
  administrativoItems,
  gerencialItems,
  allNavItems,
  NavItem,
  } from "@/lib/tenant/nav-items";
  import { useUserPreferences } from "@/lib/tenant/hooks/use-user-preferences";
  import {
  DEFAULT_ACADEMIA_LABEL,

  DEFAULT_ACTIVE_TENANT_LABEL,
  useAuthAccess,
  useTenantContext,
} from "@/lib/tenant/hooks/use-session-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function sortNavItemsByLabel(items: NavItem[]): NavItem[] {
  return [...items].sort((a, b) =>
    a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" })
  );
}

const navItemsSorted = sortNavItemsByLabel(navItems);
const atividadeItemsSorted = sortNavItemsByLabel(atividadeItems);
const treinoItemsSorted = sortNavItemsByLabel(treinoItems);
const crmItemsSorted = sortNavItemsByLabel(crmItems);
const segurancaItemsSorted = sortNavItemsByLabel(segurancaItems);
const administrativoItemsSorted = sortNavItemsByLabel(administrativoItems);
const gerencialItemsSorted = sortNavItemsByLabel(gerencialItems);
const DEFAULT_APP_NAME = DEFAULT_TENANT_APP_NAME;
const DEFAULT_BRAND_LOGO_LIGHT_URL = "/conceito-fit_tech_horizontal.svg";
const DEFAULT_BRAND_LOGO_DARK_URL = "/conceito-fit_tech_horizontal_dark.svg";

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  shellReady?: boolean;
};

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isActiveNavItem(pathname: string, item: NavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  return isActivePath(pathname, item.href);
}

function matchesAnyPath(pathname: string, items: NavItem[]): boolean {
  return items.some((item) => isActiveNavItem(pathname, item));
}

const SECTION_KEYS = {
  atividade: "atividade",
  treinos: "treinos",
  crm: "crm",
  seguranca: "seguranca",
  administrativo: "administrativo",
  gerencial: "gerencial",
} as const;

type SectionKey = (typeof SECTION_KEYS)[keyof typeof SECTION_KEYS];

function getInitialSectionStates(pathname: string): Record<SectionKey, boolean> {
  return {
    atividade: matchesAnyPath(pathname, atividadeItemsSorted),
    treinos: pathname.startsWith("/treinos"),
    crm: pathname.startsWith("/crm"),
    seguranca: pathname.startsWith("/seguranca"),
    administrativo: pathname.startsWith("/administrativo"),
    gerencial: pathname.startsWith("/gerencial"),
  };
}

function getInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (words.length === 0) return "CF";
  return words.map((w) => w[0]?.toUpperCase() ?? "").join("");
}

const SidebarBrand = memo(function SidebarBrand({
  collapsed,
  appName,
  academiaName,
  tenantName,
  logoUrl,
  defaultLogoUrl,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  appName: string;
  academiaName: string;
  tenantName: string;
  logoUrl: string;
  defaultLogoUrl: string;
  onToggleCollapsed: () => void;
}) {
  const brandLogo = logoUrl || defaultLogoUrl;
  return (
    <div className="border-b border-sidebar-border px-4 py-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          {brandLogo ? (
            // eslint-disable-next-line @next/next/no-img-element -- branding may come from tenant-provided remote URLs.
            <img
              src={brandLogo}
              alt={appName}
              width={collapsed ? 24 : 160}
              height={collapsed ? 24 : 32}
              className={cn(
                collapsed ? "mx-auto h-6 w-6 object-contain" : "mb-2 h-8 w-auto max-w-full object-contain",
                collapsed && "mt-1"
              )}
            />
          ) : null}
          {collapsed && !brandLogo ? (
            <div className="font-display text-sm font-extrabold tracking-tight text-[color:var(--sidebar-primary)]">{getInitials(appName)}</div>
          ) : null}
          {!collapsed && (
            <div className="font-display text-xl font-extrabold tracking-tight text-[color:var(--sidebar-primary)]">
              {appName}
            </div>
          )}
          {!collapsed && (
            <div className="mt-1 space-y-1 text-[11px] text-[color:color-mix(in_srgb,var(--sidebar-foreground)_68%,transparent)]">
              <div>
                <span className="font-semibold uppercase tracking-widest text-[color:color-mix(in_srgb,var(--sidebar-foreground)_55%,transparent)]">Academia</span>
                <p className="mt-0.5 truncate text-[12px] text-sidebar-foreground">
                  {academiaName}
                </p>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-widest text-[color:color-mix(in_srgb,var(--sidebar-foreground)_55%,transparent)]">Unidade</span>
                <p className="mt-0.5 truncate text-[12px] text-sidebar-foreground">
                  {tenantName}
                </p>
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="mt-0.5 hidden rounded-md border border-sidebar-border bg-sidebar-accent p-1.5 text-[color:color-mix(in_srgb,var(--sidebar-foreground)_72%,transparent)] hover:text-sidebar-foreground md:inline-flex"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>
    </div>
  );
});

const NavLinkItem = memo(function NavLinkItem({
  item,
  active,
  collapsed,
  onNavigate,
  dense = false,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  dense?: boolean;
}) {
  const Icon = item.icon;
  const { isFavorite, toggleFavorite } = useUserPreferences();
  const favorited = isFavorite(item.href);

  return (
    <div className="group relative flex items-center">
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "cursor-pointer flex flex-1 items-center rounded-md transition-colors",
          dense ? "gap-2 px-3 py-2 text-[13px]" : "gap-2.5 px-3 py-2 text-[13.5px] font-normal",
          active
            ? "bg-sidebar-accent font-medium text-[color:var(--sidebar-primary)]"
            : "text-[color:color-mix(in_srgb,var(--sidebar-foreground)_68%,transparent)] hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon className={cn("shrink-0", dense ? "size-[14px]" : "size-[16px]")} />
        {!collapsed && item.label}
      </Link>
      {!collapsed && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(item.href);
          }}
          className={cn(
            "absolute right-2 p-1 transition-all opacity-0 group-hover:opacity-100 hover:text-gym-accent",
            favorited ? "opacity-100 text-gym-accent" : "text-muted-foreground"
          )}
          aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          <Star className={cn("size-3.5", favorited && "fill-current")} />
        </button>
      )}
    </div>
  );
});

const CollapsibleSection = memo(function CollapsibleSection({
  title,
  icon: Icon,
  collapsed,
  open,
  onToggle,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  icon: LucideIcon;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "cursor-pointer flex w-full items-center justify-between rounded-md px-2 py-2 text-[10px] font-semibold uppercase tracking-widest text-[color:color-mix(in_srgb,var(--sidebar-foreground)_55%,transparent)] transition-colors hover:text-sidebar-foreground",
          collapsed && "justify-center"
        )}
        title={collapsed ? title : undefined}
      >
        <span className={cn("flex items-center gap-2", collapsed && "justify-center")}>
          <Icon className="size-3.5" />
          {!collapsed && title}
        </span>
        {!collapsed && (open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />)}
      </button>
      {open && (
        <div className="mt-1 flex flex-col gap-0.5">
          {items.map((item) => (
            <NavLinkItem
              key={item.href}
              item={item}
              active={isActiveNavItem(pathname, item)}
              collapsed={collapsed}
              onNavigate={onNavigate}
              dense
            />
          ))}
        </div>
      )}
    </div>
  );
});

function SidebarNavigation({
  collapsed,
  mobileOpen,
  onMobileClose,
  shellReady,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose?: () => void;
  shellReady: boolean;
}) {
  const pathname = usePathname();
  const access = useAuthAccess();
  const { favorites, recent } = useUserPreferences();
  const [openSections, setOpenSections] = useState(() => getInitialSectionStates(pathname));
  const elevatedModulesReady = shellReady && !access.loading && access.canAccessElevatedModules;
  const visibleSegurancaItems = elevatedModulesReady ? segurancaItemsSorted : [];
  const visibleGerencialItems = elevatedModulesReady
    ? gerencialItemsSorted
    : gerencialItemsSorted.filter((item) => item.href !== "/gerencial/bi/rede");
  const visibleAdministrativoItems = elevatedModulesReady
    ? administrativoItemsSorted
    : administrativoItemsSorted.filter(
        (item) =>
          item.href !== "/administrativo/unidades" &&
          item.href !== "/administrativo/catraca-status" &&
          item.href !== "/administrativo/nfse" &&
          item.href !== "/administrativo/integracoes"
      );

  const favoriteItems = favorites
    .map((href) => allNavItems.find((i) => i.href === href))
    .filter((i): i is NavItem => !!i);

  const recentItems = recent
    .filter((href) => href !== pathname && !favorites.includes(href))
    .map((href) => allNavItems.find((i) => i.href === href))
    .filter((i): i is NavItem => !!i)
    .slice(0, 3);

  const filteredNavItems = navItemsSorted.filter(i => !favorites.includes(i.href));
  const filteredAtividadeItems = atividadeItemsSorted.filter(i => !favorites.includes(i.href));
  const filteredTreinoItems = treinoItemsSorted.filter(i => !favorites.includes(i.href));
  const filteredCrmItems = crmItemsSorted.filter(i => !favorites.includes(i.href));
  const filteredSegurancaItems = visibleSegurancaItems.filter(i => !favorites.includes(i.href));
  const filteredGerencialItems = visibleGerencialItems.filter(i => !favorites.includes(i.href));
  const filteredAdministrativoItems = visibleAdministrativoItems.filter(i => !favorites.includes(i.href));

  useEffect(() => {
    if (mobileOpen) {
      onMobileClose?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    setOpenSections(getInitialSectionStates(pathname));
  }, [pathname]);

  return (
    <nav aria-label="Menu principal" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
      {favoriteItems.length > 0 && (
        <div className="mb-4">
          {!collapsed && (
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-[color:color-mix(in_srgb,var(--sidebar-foreground)_50%,transparent)]">
              Favoritos
            </p>
          )}
          {favoriteItems.map((item) => (
            <NavLinkItem
              key={item.href}
              item={item}
              active={isActiveNavItem(pathname, item)}
              collapsed={collapsed}
              onNavigate={onMobileClose}
              dense={collapsed}
            />
          ))}
        </div>
      )}

      {recentItems.length > 0 && (
        <div className="mb-4">
          {!collapsed && (
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-[color:color-mix(in_srgb,var(--sidebar-foreground)_50%,transparent)]">
              Recentes
            </p>
          )}
          {recentItems.map((item) => (
            <NavLinkItem
              key={item.href}
              item={item}
              active={isActiveNavItem(pathname, item)}
              collapsed={collapsed}
              onNavigate={onMobileClose}
              dense
            />
          ))}
        </div>
      )}

      {filteredNavItems.length > 0 && !collapsed && (
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-[color:color-mix(in_srgb,var(--sidebar-foreground)_50%,transparent)]">
          Principal
        </p>
      )}

      {filteredNavItems.map((item) => (
        <NavLinkItem
          key={item.href}
          item={item}
          active={isActiveNavItem(pathname, item)}
          collapsed={collapsed}
          onNavigate={onMobileClose}
        />
      ))}

      {filteredAtividadeItems.length > 0 && (
        <CollapsibleSection
          title="Atividade"
          icon={Activity}
          collapsed={collapsed}
          open={openSections.atividade ?? false}
          onToggle={() => setOpenSections((prev) => ({ ...prev, atividade: !prev.atividade }))}
          items={filteredAtividadeItems}
          pathname={pathname}
          onNavigate={onMobileClose}
        />
      )}

      {filteredTreinoItems.length > 0 && (
        <CollapsibleSection
          title="Treinos"
          icon={CalendarDays}
          collapsed={collapsed}
          open={openSections.treinos ?? false}
          onToggle={() => setOpenSections((prev) => ({ ...prev, treinos: !prev.treinos }))}
          items={filteredTreinoItems}
          pathname={pathname}
          onNavigate={onMobileClose}
        />
      )}

      {filteredCrmItems.length > 0 && (
        <CollapsibleSection
          title="CRM"
          icon={BriefcaseBusiness}
          collapsed={collapsed}
          open={openSections.crm ?? false}
          onToggle={() => setOpenSections((prev) => ({ ...prev, crm: !prev.crm }))}
          items={filteredCrmItems}
          pathname={pathname}
          onNavigate={onMobileClose}
        />
      )}

      {filteredSegurancaItems.length > 0 && (
        <CollapsibleSection
          title="Segurança"
          icon={ShieldCheck}
          collapsed={collapsed}
          open={openSections.seguranca ?? false}
          onToggle={() => setOpenSections((prev) => ({ ...prev, seguranca: !prev.seguranca }))}
          items={filteredSegurancaItems}
          pathname={pathname}
          onNavigate={onMobileClose}
        />
      )}

      {filteredGerencialItems.length > 0 && (
        <CollapsibleSection
          title="Gerencial"
          icon={LineChart}
          collapsed={collapsed}
          open={openSections.gerencial ?? false}
          onToggle={() => setOpenSections((prev) => ({ ...prev, gerencial: !prev.gerencial }))}
          items={filteredGerencialItems}
          pathname={pathname}
          onNavigate={onMobileClose}
        />
      )}

      {filteredAdministrativoItems.length > 0 && (
        <CollapsibleSection
          title="Administrativo"
          icon={Settings}
          collapsed={collapsed}
          open={openSections.administrativo ?? false}
          onToggle={() => setOpenSections((prev) => ({ ...prev, administrativo: !prev.administrativo }))}
          items={filteredAdministrativoItems}
          pathname={pathname}
          onNavigate={onMobileClose}
        />
      )}
    </nav>
  );
}

const SidebarUserPill = memo(function SidebarUserPill({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="border-t border-sidebar-border px-3 py-4">
        <div
          ref={userMenuRef}
          className={cn(
            "relative flex items-center gap-2.5 rounded-md bg-sidebar-accent px-2.5 py-2",
            collapsed && "justify-center"
          )}
        >
          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            className={cn("cursor-pointer flex items-center gap-2.5", collapsed && "justify-center")}
            aria-label="Menu do usuário"
          >
            <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-sidebar-primary font-display text-xs font-bold text-sidebar-primary-foreground">
              S
            </div>
            {!collapsed && (
              <div className="text-left">
                <p className="text-[13px] font-medium text-sidebar-foreground">Sergio</p>
                <p className="text-[11px] text-[color:color-mix(in_srgb,var(--sidebar-foreground)_64%,transparent)]">Administrador</p>
              </div>
            )}
          </button>
          {userMenuOpen && !collapsed && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-56 rounded-md border border-sidebar-border bg-sidebar p-2 shadow-lg">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-[color:color-mix(in_srgb,var(--sidebar-foreground)_55%,transparent)]">
                Conta
              </p>
              {[
                { label: "Meu perfil", href: "/conta/perfil" },
                { label: "Trocar senha", href: "/conta/seguranca" },
                { label: "Preferências", href: "/conta/preferencias" },
                { label: "Notificações", href: "/conta/notificacoes" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setUserMenuOpen(false)}
                  className="block w-full rounded-md px-2 py-2 text-left text-[13px] text-[color:color-mix(in_srgb,var(--sidebar-foreground)_68%,transparent)] hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-1 h-px bg-sidebar-border" />
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] text-[color:color-mix(in_srgb,var(--sidebar-foreground)_68%,transparent)] hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                {theme === "dark" ? "Tema claro" : "Tema escuro"}
              </button>
              <div className="my-1 h-px bg-sidebar-border" />
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  setLogoutOpen(true);
                }}
                className="block w-full cursor-pointer rounded-md px-2 py-2 text-left text-[13px] text-gym-danger hover:bg-sidebar-accent"
              >
                Sair
              </button>
            </div>
          )}
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
              onClick={async () => {
                setLoggingOut(true);
                try {
                  const redirectHref = buildLoginHref(undefined, getNetworkSlugFromSession());
                  try {
                    await logoutApi();
                  } catch {
                    // Seguimos com a limpeza local mesmo se o backend falhar.
                  }
                  clearAuthSession();
                  router.replace(redirectHref);
                  if (typeof window !== "undefined") {
                    window.location.assign(redirectHref);
                  }
                } finally {
                  setLoggingOut(false);
                }
              }}
            >
              {loggingOut ? "Saindo..." : "Sim, sair"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

function SidebarComponent({ mobileOpen = false, onMobileClose, shellReady = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [defaultLogoUrl, setDefaultLogoUrl] = useState(DEFAULT_BRAND_LOGO_DARK_URL);
  const { tenant, tenantName, academia, brandingSnapshot } = useTenantContext();
  const resolvedBranding = shellReady ? brandingSnapshot ?? tenant?.branding : undefined;
  const stableTenantName =
    shellReady && tenantName.trim() ? tenantName : DEFAULT_ACTIVE_TENANT_LABEL;
  const appName = resolvedBranding?.appName?.trim() || DEFAULT_APP_NAME;
  const logoUrl = shellReady ? resolvedBranding?.logoUrl || "" : "";
  const academiaName =
    shellReady && academia?.nome?.trim()
      ? academia.nome
      : shellReady && tenant?.nome?.trim()
        ? tenant.nome
        : DEFAULT_ACADEMIA_LABEL;

  useEffect(() => {
    function syncDefaultLogoByTheme() {
      const htmlHasDarkClass = document.documentElement.classList.contains("dark");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const useDarkVariant = htmlHasDarkClass || prefersDark;
      setDefaultLogoUrl(useDarkVariant ? DEFAULT_BRAND_LOGO_DARK_URL : DEFAULT_BRAND_LOGO_LIGHT_URL);
    }

    syncDefaultLogoByTheme();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onMediaChange = () => syncDefaultLogoByTheme();
    const observer = new MutationObserver(syncDefaultLogoByTheme);

    media.addEventListener("change", onMediaChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      media.removeEventListener("change", onMediaChange);
      observer.disconnect();
    };
  }, []);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-full w-[280px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:static md:h-screen md:translate-x-0",
        MOTION_CLASSNAMES.sidebar,
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "md:w-[72px] md:min-w-[72px]" : "md:w-[220px] md:min-w-[220px]"
      )}
    >
      <SidebarBrand
        collapsed={collapsed}
        appName={appName}
        academiaName={academiaName}
        tenantName={stableTenantName}
        logoUrl={logoUrl}
        defaultLogoUrl={defaultLogoUrl}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
      />

      <div className="px-3 py-2">
        <button
          type="button"
          onClick={() => {
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true }),
            );
          }}
          className={cn(
            "flex w-full items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            collapsed && "justify-center px-2",
          )}
        >
          <Search className="size-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Buscar...</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">
                ⌘K
              </kbd>
            </>
          )}
        </button>
      </div>

      <SidebarNavigation
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={onMobileClose}
        shellReady={shellReady}
      />

      <SidebarUserPill collapsed={collapsed} />
    </aside>
  );
}

export const Sidebar = memo(SidebarComponent);
