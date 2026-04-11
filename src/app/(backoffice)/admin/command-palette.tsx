"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Clock, Rocket, Users, Wallet } from "lucide-react";
import {
  Command as CmdkRoot,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "cmdk";
import {
  adminGroups as backofficeNavGroups,
  allAdminNavItems as allBackofficeNavItems,
} from "@/backoffice/lib/nav-items";

const RECENT_ROUTES_KEY = "backoffice-recent-routes";
const MAX_RECENT_ROUTES = 5;

type RecentRoute = { href: string; label: string; timestamp: number };

function readRecentRoutes(): RecentRoute[] {
  try {
    const raw = localStorage.getItem(RECENT_ROUTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as RecentRoute[]) : [];
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

const ITEM_CLASS =
  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground aria-selected:bg-gym-accent/10 aria-selected:text-foreground";
const GROUP_HEADING_CLASS =
  "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground/60";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [recentRoutes, setRecentRoutes] = useState<RecentRoute[]>([]);

  useEffect(() => {
    if (open) {
      // A paleta precisa refletir as rotas recentes só quando abre.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const recentWithIcons = useMemo(() => {
    return recentRoutes.map((r) => {
      const navItem = allBackofficeNavItems.find((n) => n.href === r.href);
      return { ...r, icon: navItem?.icon || Clock };
    });
  }, [recentRoutes]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg rounded-xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CmdkRoot label="Command palette" className="flex flex-col">
          <CommandInput
            placeholder="Navegar para..."
            className="border-b border-border/40 bg-transparent px-4 py-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <CommandList className="max-h-72 overflow-y-auto p-2 scrollbar-none">
            <CommandEmpty className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhuma página encontrada.
            </CommandEmpty>

            <CommandGroup heading="Ações Rápidas" className={GROUP_HEADING_CLASS}>
              {quickActions.map((action) => (
                <CommandItem
                  key={action.id}
                  onSelect={() => handleNavigate(action.href, action.label)}
                  className={ITEM_CLASS}
                >
                  <action.icon className="size-4 shrink-0" />
                  {action.label}
                </CommandItem>
              ))}
            </CommandGroup>

            {recentWithIcons.length > 0 && (
              <CommandGroup heading="Recentes" className={GROUP_HEADING_CLASS}>
                {recentWithIcons.map((route) => (
                  <CommandItem
                    key={route.href}
                    onSelect={() => handleNavigate(route.href, route.label)}
                    className={ITEM_CLASS}
                  >
                    <route.icon className="size-4 shrink-0" />
                    {route.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {backofficeNavGroups.map((group) => (
              <CommandGroup
                key={group.label}
                heading={group.label}
                className={GROUP_HEADING_CLASS}
              >
                {group.items.map((item) => (
                  <CommandItem
                    key={item.href}
                    onSelect={() => handleNavigate(item.href, item.label)}
                    className={ITEM_CLASS}
                  >
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
