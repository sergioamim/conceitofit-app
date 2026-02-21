"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  ClipboardList,
  CreditCard,
  Activity,
  DollarSign,
  BriefcaseBusiness,
  Kanban,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/prospects", label: "Prospects", icon: UserPlus },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/matriculas", label: "Matrículas", icon: ClipboardList },
  { href: "/planos", label: "Planos", icon: CreditCard },
  { href: "/atividades", label: "Atividades", icon: Activity },
  { href: "/pagamentos", label: "Pagamentos", icon: DollarSign },
];

const crmItems = [
  { href: "/crm/prospects-kanban", label: "Funil de Vendas", icon: Kanban },
];

const administrativoItems = [
  { href: "/administrativo/formas-pagamento", label: "Formas de Pagamento", icon: Settings },
  { href: "/administrativo/academia", label: "Academia", icon: Settings },
  { href: "/administrativo/funcionarios", label: "Funcionários", icon: Settings },
  { href: "/administrativo/horarios", label: "Horários", icon: Settings },
  { href: "/administrativo/convenios", label: "Convênios", icon: Settings },
  { href: "/administrativo/servicos", label: "Serviços", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [crmOpen, setCrmOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [administrativoOpen, setAdministrativoOpen] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border bg-surface transition-all",
        collapsed ? "w-[72px] min-w-[72px]" : "w-[220px] min-w-[220px]"
      )}
    >
      {/* Logo */}
      <div className="border-b border-border px-4 py-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-display text-xl font-extrabold tracking-tight text-gym-accent">
              {collapsed ? "FM" : "FitManager"}
            </div>
            {!collapsed && (
              <div className="mt-0.5 text-[11px] uppercase tracking-widest text-muted-foreground">
                Academia Força Total
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="mt-0.5 rounded-md border border-border bg-secondary p-1.5 text-muted-foreground hover:text-foreground"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
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
        <div className={cn(
          "flex items-center gap-2.5 rounded-md bg-secondary px-2.5 py-2",
          collapsed && "justify-center"
        )}>
          <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-gym-accent font-display text-xs font-bold text-background">
            S
          </div>
          {!collapsed && (
            <div>
              <p className="text-[13px] font-medium">Sergio</p>
              <p className="text-[11px] text-muted-foreground">Administrador</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
