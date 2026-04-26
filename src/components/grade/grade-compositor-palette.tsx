"use client";

import { useMemo, useState } from "react";
import type { Atividade, Funcionario } from "@/lib/types";
import { getModalidadeCor } from "@/lib/grade/modalidade-cor";
import { Input } from "@/components/ui/input";

const CATEGORIA_LABEL: Record<Atividade["categoria"], string> = {
  COLETIVA: "Coletivas",
  CARDIO: "Cardio",
  LUTA: "Lutas",
  AQUATICA: "Aquáticas",
  MUSCULACAO: "Musculação",
  OUTRA: "Outras",
};

export interface GradeCompositorPaletteProps {
  atividades: Atividade[];
  funcionarios: Funcionario[];
  /** Callback quando o usuário inicia drag de uma atividade. */
  onDragAtividade: (atividadeId: string) => void;
  /** Callback ao clicar (alternativa ao drag pra teclado). */
  onPickAtividade: (atividadeId: string) => void;
}

export function GradeCompositorPalette({
  atividades,
  funcionarios,
  onDragAtividade,
  onPickAtividade,
}: GradeCompositorPaletteProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return atividades.filter((a) => a.ativo && (q === "" || a.nome.toLowerCase().includes(q)));
  }, [atividades, query]);

  const grouped = useMemo(() => {
    const m = new Map<Atividade["categoria"], Atividade[]>();
    filtered.forEach((a) => {
      const arr = m.get(a.categoria) ?? [];
      arr.push(a);
      m.set(a.categoria, arr);
    });
    return Array.from(m.entries()).sort(([a], [b]) =>
      CATEGORIA_LABEL[a].localeCompare(CATEGORIA_LABEL[b]),
    );
  }, [filtered]);

  return (
    <aside className="flex w-[260px] shrink-0 flex-col overflow-hidden border-r border-border bg-card">
      <div className="border-b border-border p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Biblioteca
        </p>
        <h3 className="mt-0.5 text-sm font-bold">Aulas-modelo</h3>
        <Input
          type="search"
          placeholder="Buscar..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-2.5 h-8 text-xs"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2.5">
        {grouped.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Nenhuma atividade cadastrada.
          </p>
        ) : (
          grouped.map(([cat, items]) => (
            <div key={cat} className="mb-3">
              <p className="px-1.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {CATEGORIA_LABEL[cat]}
              </p>
              {items.map((a) => {
                const cor = getModalidadeCor(a);
                return (
                  <button
                    key={a.id}
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "copy";
                      e.dataTransfer.setData("text/atividade-id", a.id);
                      onDragAtividade(a.id);
                    }}
                    onClick={() => onPickAtividade(a.id)}
                    className="mb-1 flex w-full cursor-grab items-center gap-2.5 rounded-md border border-border bg-card px-2.5 py-2 text-left transition hover:border-foreground/30 hover:shadow-sm active:cursor-grabbing"
                  >
                    <span
                      className="h-6 w-[3px] shrink-0 rounded-sm"
                      style={{ background: cor.cor }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{a.nome}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {CATEGORIA_LABEL[a.categoria]}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ))
        )}

        {funcionarios.length > 0 ? (
          <div className="mt-1">
            <p className="px-1.5 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Professores
            </p>
            {funcionarios.slice(0, 8).map((p) => {
              const ini = p.nome
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground">
                    {ini}
                  </span>
                  <span className="flex-1 truncate">{p.nome}</span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
