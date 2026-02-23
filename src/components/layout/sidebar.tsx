"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  ClipboardList,
  CreditCard,
  Activity,
  CalendarDays,
  DollarSign,
  ShoppingCart,
  BriefcaseBusiness,
  LineChart,
  HandCoins,
  Kanban,
  Megaphone,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentAcademia, getCurrentTenant } from "@/lib/mock/services";
import { getTenantAppName } from "@/lib/tenant-theme";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/prospects", label: "Prospects", icon: UserPlus },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/matriculas", label: "Matrículas", icon: ClipboardList },
  { href: "/planos", label: "Planos", icon: CreditCard },
  { href: "/atividades", label: "Atividades", icon: Activity },
  { href: "/grade", label: "Grade", icon: CalendarDays },
  { href: "/vendas/nova", label: "Vendas", icon: ShoppingCart },
  { href: "/pagamentos", label: "Pagamentos", icon: DollarSign },
];

const crmItems = [
  { href: "/crm/prospects-kanban", label: "Funil de Vendas", icon: Kanban },
  { href: "/crm/campanhas", label: "Campanhas", icon: Megaphone },
];

const administrativoItems = [
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

const gerencialItems = [
  { href: "/gerencial/contas-a-receber", label: "Contas a Receber", icon: HandCoins },
  { href: "/gerencial/contas-a-pagar", label: "Contas a Pagar", icon: DollarSign },
  { href: "/gerencial/dre", label: "DRE", icon: LineChart },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [crmOpen, setCrmOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [administrativoOpen, setAdministrativoOpen] = useState(false);
  const [gerencialOpen, setGerencialOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [tenantName, setTenantName] = useState("Academia");
  const [appName, setAppName] = useState("Conceito Fit");
  const [logoUrl, setLogoUrl] = useState("");

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

  useEffect(() => {
    async function load() {
      const [tenant, academia] = await Promise.all([
        getCurrentTenant(),
        getCurrentAcademia(),
      ]);
      setTenantName(tenant.nome);
      setAppName(getTenantAppName(academia));
      setLogoUrl(academia.branding?.logoUrl ?? "");
    }
    load();
    function handleUpdate() {
      load();
    }
    window.addEventListener("academia-store-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("academia-store-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  function getInitials(name: string): string {
    const words = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);
    if (words.length === 0) return "CF";
    return words.map((w) => w[0]?.toUpperCase() ?? "").join("");
  }

  useEffect(() => {
    if (mobileOpen) {
      onMobileClose?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-full w-[280px] flex-col border-r border-border bg-surface transition-transform md:static md:h-screen md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "md:w-[72px] md:min-w-[72px]" : "md:w-[220px] md:min-w-[220px]"
      )}
    >
      {/* Logo */}
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
            onClick={() => setCollapsed((v) => !v)}
            className="mt-0.5 hidden rounded-md border border-border bg-secondary p-1.5 text-muted-foreground hover:text-foreground md:inline-flex"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4 overflow-y-auto">
        {!collapsed && (
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Principal
          </p>
        )}
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => onMobileClose?.()}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] font-normal transition-colors",
                active
                  ? "bg-gym-accent/10 font-medium text-gym-accent"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="size-[16px] shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}

        <div className="mt-4">
          <button
            onClick={() => setCrmOpen((v) => !v)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-2 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 transition-colors hover:text-foreground",
              collapsed && "justify-center"
            )}
            title={collapsed ? "CRM" : undefined}
          >
            <span className={cn("flex items-center gap-2", collapsed && "justify-center")}>
              <BriefcaseBusiness className="size-3.5" />
              {!collapsed && "CRM"}
            </span>
            {!collapsed && (crmOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />)}
          </button>
          {crmOpen && (
            <div className="mt-1 flex flex-col gap-0.5">
              {crmItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => onMobileClose?.()}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-[13px] transition-colors",
                      active
                        ? "bg-gym-accent/10 font-medium text-gym-accent"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                    title={collapsed ? label : undefined}
                  >
                    <Icon className="size-[14px] shrink-0" />
                    {!collapsed && label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4">
          <button
            onClick={() => setGerencialOpen((v) => !v)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-2 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 transition-colors hover:text-foreground",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Gerencial" : undefined}
          >
            <span className={cn("flex items-center gap-2", collapsed && "justify-center")}>
              <LineChart className="size-3.5" />
              {!collapsed && "Gerencial"}
            </span>
            {!collapsed && (gerencialOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />)}
          </button>
          {gerencialOpen && (
            <div className="mt-1 flex flex-col gap-0.5">
              {gerencialItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => onMobileClose?.()}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-[13px] transition-colors",
                      active
                        ? "bg-gym-accent/10 font-medium text-gym-accent"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                    title={collapsed ? label : undefined}
                  >
                    <Icon className="size-[14px] shrink-0" />
                    {!collapsed && label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4">
          <button
            onClick={() => setAdministrativoOpen((v) => !v)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-2 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 transition-colors hover:text-foreground",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Administrativo" : undefined}
          >
            <span className={cn("flex items-center gap-2", collapsed && "justify-center")}>
              <Settings className="size-3.5" />
              {!collapsed && "Administrativo"}
            </span>
            {!collapsed && (administrativoOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />)}
          </button>
          {administrativoOpen && (
            <div className="mt-1 flex flex-col gap-0.5">
              {administrativoItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => onMobileClose?.()}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-[13px] transition-colors",
                      active
                        ? "bg-gym-accent/10 font-medium text-gym-accent"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                    title={collapsed ? label : undefined}
                  >
                    <Icon className="size-[14px] shrink-0" />
                    {!collapsed && label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* User pill */}
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
            className={cn("flex items-center gap-2.5", collapsed && "justify-center")}
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
                { label: "Sair", href: "/conta/sair" },
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
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
