"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
  CreditCard,
  ShoppingCart,
  DollarSign,
  Activity,
  CalendarDays,
  Dumbbell,
  Settings,
  ShieldCheck,
  LineChart,
} from "lucide-react";
import { allNavItems } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const onSelect = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center border-b border-border px-4">
          <Search className="mr-2 size-4 shrink-0 text-muted-foreground" />
          <Command.Input
            placeholder="O que você está procurando? (Páginas, clientes...)"
            value={search}
            onValueChange={setSearch}
            className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </div>
        </div>

        <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin">
          <Command.Empty className="px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum resultado encontrado.
          </Command.Empty>

          <Command.Group heading="Ações Rápidas" className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Command.Item
              onSelect={() => onSelect("/dashboard")}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground aria-selected:bg-secondary aria-selected:text-gym-accent"
            >
              <LayoutDashboard className="size-4" />
              <span>Dashboard Principal</span>
            </Command.Item>
            <Command.Item
              onSelect={() => onSelect("/vendas/nova")}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground aria-selected:bg-secondary aria-selected:text-gym-accent"
            >
              <ShoppingCart className="size-4" />
              <span>Nova Venda</span>
            </Command.Item>
          </Command.Group>

          <Command.Separator className="my-2 h-px bg-border" />

          <Command.Group heading="Navegação" className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Command.Item
                  key={item.href}
                  onSelect={() => onSelect(item.href)}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground aria-selected:bg-secondary aria-selected:text-gym-accent"
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Command.Item>
              );
            })}
          </Command.Group>
        </Command.List>

        <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="rounded border border-border bg-card px-1 py-0.5">↑↓</span> Navegar
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="rounded border border-border bg-card px-1 py-0.5">↵</span> Selecionar
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Academia App <span className="text-gym-accent">v1.0</span>
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
}
