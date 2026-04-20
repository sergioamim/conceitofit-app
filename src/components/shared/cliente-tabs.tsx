"use client";

import Link from "next/link";
import {
  AlertTriangle,
  FileText,
  Heart,
  Dumbbell,
  Activity,
  ClipboardList,
  Gift,
  Folder,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ClienteTabKey =
  | "resumo"
  | "relacionamento"
  | "matriculas"
  | "financeiro"
  | "nfse"
  | "frequencia"
  | "treinos"
  | "avaliacoes"
  | "fidelidade"
  | "documentos";

type ClienteTabItem = {
  key: ClienteTabKey;
  label: string;
  icon?: LucideIcon;
};

/**
 * Conjunto final de abas do Perfil v3 (Wave 4, Seção 10.4 do PRD).
 * Ordem canônica:
 *   Resumo · Relacionamento · Contratos · Financeiro · NFS-e · Frequência ·
 *   Treinos · Avaliações · Fidelidade · Documentos
 *
 * Removidas do TabBar (Wave 4):
 *   - "Edição": duplicava o `ClienteEditDrawer` (AC4.5)
 *   - "Cartões": movida para o `ActionMenu` do header (AC4.6)
 *   - "Atividades": placeholder dissolvido em Frequência/Treinos/Avaliações (AC4.1)
 *
 * Mensagens e Notas ficam para próxima iteração (D8 e D11).
 */
const TAB_ITEMS: ClienteTabItem[] = [
  { key: "resumo", label: "Resumo" },
  { key: "relacionamento", label: "Relacionamento", icon: Heart },
  { key: "matriculas", label: "Contratos" },
  { key: "financeiro", label: "Financeiro" },
  { key: "nfse", label: "NFS-e", icon: FileText },
  { key: "frequencia", label: "Frequência", icon: Activity },
  { key: "treinos", label: "Treinos", icon: Dumbbell },
  { key: "avaliacoes", label: "Avaliações", icon: ClipboardList },
  { key: "fidelidade", label: "Fidelidade", icon: Gift },
  { key: "documentos", label: "Documentos", icon: Folder },
];

export function ClienteTabs({
  current,
  baseHref,
  onSelect,
  pendenteFinanceiro,
}: {
  current: ClienteTabKey;
  baseHref: string;
  onSelect?: (tab: ClienteTabKey) => void;
  pendenteFinanceiro?: boolean;
  /** Mantido apenas por retrocompatibilidade — aba "Edição" foi removida no Wave 4 (AC4.5). */
  showEditTab?: boolean;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      aria-label="Seções do cliente"
    >
      {TAB_ITEMS.map((t) => {
        const active = current === t.key;
        const Icon = t.icon;

        const content = (
          <>
            {Icon && <Icon className="size-3.5" />}
            {t.label}
            {t.key === "financeiro" && pendenteFinanceiro && (
              <AlertTriangle className="size-3.5 text-gym-warning" />
            )}
          </>
        );

        const className = cn(
          "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
          active
            ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
            : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
        );

        if (onSelect) {
          return (
            <button
              key={t.key}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onSelect(t.key)}
              className={className}
            >
              {content}
            </button>
          );
        }

        return (
          <Link
            key={t.key}
            href={baseHref}
            className={className}
            aria-current={active ? "page" : undefined}
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}
