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
  ClipboardList,
  CreditCard,
  DollarSign,
  HandCoins,
  Kanban,
  LayoutDashboard,
  LineChart,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShoppingCart,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authLogout, getCurrentAcademia, getCurrentTenant } from "@/lib/mock/services";
import { getStore } from "@/lib/mock/store";
import { getTenantAppName } from "@/lib/tenant-theme";
import { isRealApiEnabled } from "@/lib/api/http";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/prospects", label: "Prospects", icon: UserPlus },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/matriculas", label: "Matrículas", icon: ClipboardList },
  { href: "/planos", label: "Planos", icon: CreditCard },
  { href: "/atividades", label: "Atividades", icon: Activity },
  { href: "/grade", label: "Grade", icon: CalendarDays },
  { href: "/vendas", label: "Vendas", icon: ShoppingCart },
  { href: "/pagamentos", label: "Pagamentos", icon: DollarSign },
];

const crmItems: NavItem[] = [
  { href: "/crm/prospects-kanban", label: "Funil de Vendas", icon: Kanban },
  { href: "/crm/campanhas", label: "Campanhas", icon: Megaphone },
];

const administrativoItems: NavItem[] = [
  { href: "/administrativo/formas-pagamento", label: "Formas de Pagamento", icon: Settings },
  { href: "/administrativo/bandeiras", label: "Bandeiras de Cartão", icon: Settings },
  { href: "/administrativo/unidades", label: "Unidades", icon: Settings },
  { href: "/administrativo/academia", label: "Academia", icon: Settings },
  { href: "/administrativo/funcionarios", label: "Funcionários", icon: Settings },
  { href: "/administrativo/salas", label: "Salas", icon: Settings },
  { href: "/administrativo/atividades", label: "Atividades", icon: Settings },
  { href: "/administrativo/atividades-grade", label: "Atividades - Grade", icon: Settings },
  { href: "/administrativo/horarios", label: "Horários", icon: Settings },
  { href: "/administrativo/convenios", label: "Convênios", icon: Settings },
  { href: "/administrativo/produtos", label: "Produtos", icon: Settings },
  { href: "/administrativo/servicos", label: "Serviços", icon: Settings },
  { href: "/administrativo/tipos-conta", label: "Tipos de Conta", icon: Settings },
  { href: "/administrativo/vouchers", label: "Vouchers", icon: Settings },
];

const gerencialItems: NavItem[] = [
  { href: "/gerencial/contas-a-receber", label: "Contas a Receber", icon: HandCoins },
  { href: "/gerencial/contas-a-pagar", label: "Contas a Pagar", icon: DollarSign },
  { href: "/gerencial/dre", label: "DRE", icon: LineChart },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
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
  tenantName,
  logoUrl,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  appName: string;
  tenantName: string;
  logoUrl: string;
  onToggleCollapsed: () => void;
}) {
  return (
    <div className="border-b border-border px-4 py-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={appName}
              className={cn("mb-2 h-8 w-auto object-contain", collapsed && "mb-0")}
            />
          ) : null}
          <div className="font-display text-xl font-extrabold tracking-tight text-gym-accent">
            {collapsed ? getInitials(appName) : appName}
          </div>
          {!collapsed && (
            <div className="mt-0.5 text-[11px] uppercase tracking-widest text-muted-foreground">
              {tenantName}
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapsed}
          className="mt-0.5 hidden rounded-md border border-border bg-secondary p-1.5 text-muted-foreground hover:text-foreground md:inline-flex"
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
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "cursor-pointer flex items-center rounded-md transition-colors",
        dense ? "gap-2 px-3 py-2 text-[13px]" : "gap-2.5 px-3 py-2 text-[13.5px] font-normal",
        active
          ? "bg-gym-accent/10 font-medium text-gym-accent"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className={cn("shrink-0", dense ? "size-[14px]" : "size-[16px]")} />
      {!collapsed && item.label}
    </Link>
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
        onClick={onToggle}
        className={cn(
          "cursor-pointer flex w-full items-center justify-between rounded-md px-2 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 transition-colors hover:text-foreground",
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
              active={isActivePath(pathname, item.href)}
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
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const [crmOpen, setCrmOpen] = useState(false);
  const [administrativoOpen, setAdministrativoOpen] = useState(false);
  const [gerencialOpen, setGerencialOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      onMobileClose?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
      {!collapsed && (
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Principal
        </p>
      )}

      {navItems.map((item) => (
        <NavLinkItem
          key={item.href}
          item={item}
          active={isActivePath(pathname, item.href)}
          collapsed={collapsed}
          onNavigate={onMobileClose}
        />
      ))}

      <CollapsibleSection
        title="CRM"
        icon={BriefcaseBusiness}
        collapsed={collapsed}
        open={crmOpen}
        onToggle={() => setCrmOpen((v) => !v)}
        items={crmItems}
        pathname={pathname}
        onNavigate={onMobileClose}
      />

      <CollapsibleSection
        title="Gerencial"
        icon={LineChart}
        collapsed={collapsed}
        open={gerencialOpen}
        onToggle={() => setGerencialOpen((v) => !v)}
        items={gerencialItems}
        pathname={pathname}
        onNavigate={onMobileClose}
      />

      <CollapsibleSection
        title="Administrativo"
        icon={Settings}
        collapsed={collapsed}
        open={administrativoOpen}
        onToggle={() => setAdministrativoOpen((v) => !v)}
        items={administrativoItems}
        pathname={pathname}
        onNavigate={onMobileClose}
      />
    </nav>
  );
}

const SidebarUserPill = memo(function SidebarUserPill({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
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
      <div className="border-t border-border px-3 py-4">
        <div
          ref={userMenuRef}
          className={cn(
            "relative flex items-center gap-2.5 rounded-md bg-secondary px-2.5 py-2",
            collapsed && "justify-center"
          )}
        >
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className={cn("cursor-pointer flex items-center gap-2.5", collapsed && "justify-center")}
            aria-label="Menu do usuário"
          >
            <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-gym-accent font-display text-xs font-bold text-background">
              S
            </div>
            {!collapsed && (
              <div className="text-left">
                <p className="text-[13px] font-medium">Sergio</p>
                <p className="text-[11px] text-muted-foreground">Administrador</p>
              </div>
            )}
          </button>
          {userMenuOpen && !collapsed && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-56 rounded-md border border-border bg-card p-2 shadow-lg">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
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
                  className="block w-full rounded-md px-2 py-2 text-left text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  setLogoutOpen(true);
                }}
                className="mt-1 block w-full cursor-pointer rounded-md px-2 py-2 text-left text-[13px] text-gym-danger hover:bg-secondary"
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
                  await authLogout();
                  router.replace("/login");
                  if (typeof window !== "undefined") {
                    window.location.assign("/login");
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

function SidebarComponent({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [tenantName, setTenantName] = useState("Academia");
  const [appName, setAppName] = useState("Conceito Fit");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const useRealApi = isRealApiEnabled();

    function syncFromStore() {
      const store = getStore();
      const tenant = store.tenants.find((item) => item.id === store.currentTenantId) ?? store.tenant;
      const academiaId = tenant?.academiaId ?? tenant?.groupId;
      const academia = store.academias.find((item) => item.id === academiaId) ?? store.academias[0];
      setTenantName(tenant?.nome ?? "Academia");
      setAppName(getTenantAppName(academia));
      setLogoUrl(academia?.branding?.logoUrl ?? "");
    }

    async function load() {
      try {
        const [tenant, academia] = await Promise.all([getCurrentTenant(), getCurrentAcademia()]);
        setTenantName(tenant.nome);
        setAppName(getTenantAppName(academia));
        setLogoUrl(academia.branding?.logoUrl ?? "");
      } catch {
        // Mantem estado atual em caso de indisponibilidade temporaria da API.
      }
    }
    if (!useRealApi) {
      syncFromStore();
    }
    load();

    function handleUpdate() {
      if (useRealApi) return;
      syncFromStore();
    }
    window.addEventListener("academia-store-updated", handleUpdate);
    return () => {
      window.removeEventListener("academia-store-updated", handleUpdate);
    };
  }, []);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-full w-[280px] flex-col border-r border-border bg-surface transition-transform md:static md:h-screen md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "md:w-[72px] md:min-w-[72px]" : "md:w-[220px] md:min-w-[220px]"
      )}
    >
      <SidebarBrand
        collapsed={collapsed}
        appName={appName}
        tenantName={tenantName}
        logoUrl={logoUrl}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
      />

      <SidebarNavigation collapsed={collapsed} mobileOpen={mobileOpen} onMobileClose={onMobileClose} />

      <SidebarUserPill collapsed={collapsed} />
    </aside>
  );
}

export const Sidebar = memo(SidebarComponent);
