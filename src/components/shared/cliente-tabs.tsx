"use client";

import Link from "next/link";
import { CreditCard, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ClienteTabKey = "resumo" | "matriculas" | "financeiro" | "editar" | "cartoes";
type ClienteTabItem = {
  key: ClienteTabKey;
  label: string;
  icon?: React.ElementType;
};

export function ClienteTabs({
  current,
  baseHref,
  onSelect,
  pendenteFinanceiro,
  showEditTab,
}: {
  current: ClienteTabKey;
  baseHref: string;
  onSelect?: (tab: Exclude<ClienteTabKey, "cartoes">) => void;
  pendenteFinanceiro?: boolean;
  showEditTab?: boolean;
}) {
  const base: ClienteTabItem[] = [
    { key: "resumo", label: "Dashboard" },
    { key: "matriculas", label: "Matrículas" },
    { key: "financeiro", label: "Financeiro" },
    { key: "cartoes", label: "Cartões", icon: CreditCard },
  ];
  const items: ClienteTabItem[] = showEditTab
    ? [...base, { key: "editar", label: "Edição", icon: undefined }]
    : base;

  return (
    <div className="flex items-center gap-2">
      {items.map((t) => {
        const active = current === t.key;
        const Icon = t.icon;
        if (t.key === "cartoes") {
          return (
            <Link
              key={t.key}
              href={`${baseHref}/cartoes`}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors inline-flex items-center gap-2",
                active
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              )}
            >
              {Icon && <Icon className="size-3.5" />}
              {t.label}
            </Link>
          );
        }
        if (onSelect) {
          return (
            <button
              key={t.key}
              onClick={() => onSelect(t.key as Exclude<ClienteTabKey, "cartoes">)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors inline-flex items-center gap-2",
                active
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              )}
            >
              {t.label}
              {t.key === "financeiro" && pendenteFinanceiro && (
                <AlertTriangle className="size-3.5 text-gym-warning" />
              )}
            </button>
          );
        }
        return (
          <Link
            key={t.key}
            href={baseHref}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
