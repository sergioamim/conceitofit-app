"use client";

/**
 * SessaoSidebar — coluna esquerda do editor V3 com lista de sessões
 * (A/B/C). Extraído de treino-v3-editor.tsx para reduzir o arquivo
 * principal abaixo do limite de 500 linhas (Wave H.4).
 *
 * Renderiza letter box + nome + contador de exercícios. Sessão ativa
 * destaca em accent; hover expõe duplicar; "Remover sessão" só
 * aparece quando há mais de uma.
 *
 * Wave J.4: cada tab vira **droppable** para receber exercícios
 * arrastados de outra sessão (drag entre A/B/C).
 */

import { useDroppable } from "@dnd-kit/core";
import { Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TreinoV2EditorSeed } from "@/lib/tenant/treinos/v2-runtime";

type Sessao = TreinoV2EditorSeed["sessoes"][number];

/** Prefix usado nos ids dos droppables — separa de ids de items. */
export const SESSAO_DROP_PREFIX = "drop-sessao-";

export interface SessaoSidebarProps {
  sessoes: Sessao[];
  activeSessaoId: string;
  activeSessao: Sessao | null;
  onSelectSessao: (id: string) => void;
  onAddSessao: () => void;
  onDuplicateSessao: (id: string) => void;
  onRemoveSessao: (id: string) => void;
}

export function SessaoSidebar({
  sessoes,
  activeSessaoId,
  activeSessao,
  onSelectSessao,
  onAddSessao,
  onDuplicateSessao,
  onRemoveSessao,
}: SessaoSidebarProps) {
  return (
    <aside className="space-y-1 rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between border-b border-border px-1 pb-2.5">
        <span className="text-[13px] font-bold">Sessões</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onAddSessao}
          title="Nova sessão"
        >
          <Plus className="size-4" />
        </Button>
      </div>
      {sessoes.map((s, idx) => (
        <SessaoTab
          key={s.id}
          sessao={s}
          index={idx}
          ativa={s.id === activeSessaoId}
          enableDuplicate={s.id === activeSessaoId && sessoes.length > 1}
          onSelect={onSelectSessao}
          onDuplicate={onDuplicateSessao}
        />
      ))}
      {sessoes.length > 1 && activeSessao ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full text-xs text-gym-danger hover:text-gym-danger"
          onClick={() => onRemoveSessao(activeSessao.id)}
        >
          <Trash2 className="mr-1 size-3.5" />
          Remover sessão
        </Button>
      ) : null}
    </aside>
  );
}

function SessaoTab({
  sessao,
  index,
  ativa,
  enableDuplicate,
  onSelect,
  onDuplicate,
}: {
  sessao: Sessao;
  index: number;
  ativa: boolean;
  enableDuplicate: boolean;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${SESSAO_DROP_PREFIX}${sessao.id}`,
  });
  const letter = (sessao.nome || String.fromCharCode(65 + index))
    .charAt(0)
    .toUpperCase();

  return (
    <button
      ref={setNodeRef}
      onClick={() => onSelect(sessao.id)}
      className={cn(
        "group flex w-full items-center gap-3 rounded-md border px-2.5 py-2 text-left transition-colors",
        ativa
          ? "border-gym-accent/40 bg-gym-accent/[0.08]"
          : "border-transparent hover:bg-secondary/60",
        // Highlight quando outro item está sendo arrastado por cima
        isOver &&
          !ativa &&
          "border-gym-accent ring-2 ring-gym-accent/40 bg-gym-accent/[0.12]",
      )}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg border text-sm font-bold",
          ativa
            ? "border-gym-accent bg-gym-accent text-black"
            : "border-border bg-secondary text-foreground",
          isOver && !ativa && "border-gym-accent",
        )}
      >
        {letter}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">
          {sessao.nome || `Sessão ${index + 1}`}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {isOver && !ativa
            ? "soltar aqui →"
            : `${sessao.itens.length} ex`}
        </div>
      </div>
      {enableDuplicate ? (
        <span
          role="button"
          tabIndex={0}
          className="opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(sessao.id);
          }}
          title="Duplicar sessão"
        >
          <Copy className="size-3.5 text-muted-foreground" />
        </span>
      ) : null}
    </button>
  );
}
