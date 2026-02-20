"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  ClipboardList,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/prospects", label: "Prospects", icon: UserPlus },
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/matriculas", label: "Matrículas", icon: ClipboardList },
  { href: "/planos", label: "Planos", icon: CreditCard },
  { href: "/pagamentos", label: "Pagamentos", icon: DollarSign },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[220px] min-w-[220px] flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="border-b border-border px-5 py-6">
        <div className="font-display text-xl font-extrabold tracking-tight text-gym-accent">
          FitManager
        </div>
        <div className="mt-0.5 text-[11px] uppercase tracking-widest text-muted-foreground">
          Academia Força Total
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Principal
        </p>
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
            >
              <Icon className="size-[16px] shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User pill */}
      <div className="border-t border-border px-3 py-4">
        <div className="flex items-center gap-2.5 rounded-md bg-secondary px-2.5 py-2">
          <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-gym-accent font-display text-xs font-bold text-background">
            S
          </div>
          <div>
            <p className="text-[13px] font-medium">Sergio</p>
            <p className="text-[11px] text-muted-foreground">Administrador</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
