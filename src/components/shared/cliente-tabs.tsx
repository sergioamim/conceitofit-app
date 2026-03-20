"use client";

import Link from "next/link";
import { CreditCard, AlertTriangle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export type ClienteTabKey = "resumo" | "matriculas" | "financeiro" | "nfse" | "editar" | "cartoes";
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
  onSelect?: (tab: ClienteTabKey) => void;
  pendenteFinanceiro?: boolean;
  showEditTab?: boolean;
}) {
  const base: ClienteTabItem[] = [
    { key: "resumo", label: "Dashboard" },
    { key: "matriculas", label: "Planos" },
    { key: "financeiro", label: "Financeiro" },
    { key: "nfse", label: "NFS-e", icon: FileText },
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
        if (onSelect) {
          return (
            <button
              key={t.key}
              onClick={() => onSelect(t.key)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors inline-flex items-center gap-2",
                active
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              )}
            >
              {Icon && <Icon className="size-3.5" />}
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
